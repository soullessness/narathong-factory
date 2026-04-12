'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Upload, X, Package, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ProductPickerModal } from '@/components/product/ProductPickerModal'
import { CustomItemDialog } from '@/components/quotation/CustomItemDialog'
import type { QuotationItem, Quotation } from '@/types/quotation'
import type { Product } from '@/types/product'
import { computeAreaPricing } from '@/types/product'
import type { PriceRequestStatus } from '@/types/price-request'
import { canAccess } from '@/lib/permissions'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
}

function parseQuotationMeta(q: Quotation) {
  const metaMatch = (q.notes || '').match(/__META__([\s\S]*?)__END__/)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1])
      return {
        ...q,
        discount_type: meta.discount_type || 'amount',
        vat_enabled: meta.vat_enabled ?? true,
        vat_amount: meta.vat_amount || 0,
        notes: (q.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim(),
      } as Quotation
    } catch {
      // ignore
    }
  }
  return { ...q, discount_type: 'amount' as const, vat_enabled: true, vat_amount: 0 }
}

const DEFAULT_ITEM = (): QuotationItem => ({
  id: uuidv4(),
  name: '',
  description: '',
  quantity: 1,
  unit: 'ชิ้น',
  unit_price: 0,
  total: 0,
  image_url: null,
})

export default function EditQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string
  const quotationId = params.quotationId as string

  const [quotation, setQuotation] = useState<Quotation | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [validUntil, setValidUntil] = useState('')
  const [items, setItems] = useState<QuotationItem[]>([DEFAULT_ITEM()])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
  const [vatEnabled, setVatEnabled] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [customItemOpen, setCustomItemOpen] = useState(false)
  const [refreshingPrices, setRefreshingPrices] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const autoRefreshTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load current user role
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserRole(user.user_metadata?.role ?? '')
    })
  }, [])

  const canSendPriceRequest = ['admin', 'executive', 'factory_manager', 'accounting'].includes(userRole)

  const fetchQuotation = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations/${quotationId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      const parsed = parseQuotationMeta(json.data as Quotation)
      setQuotation(parsed)

      // Pre-fill form
      setValidUntil(parsed.valid_until || '')
      setItems(
        parsed.items && parsed.items.length > 0
          ? parsed.items
          : [DEFAULT_ITEM()]
      )
      // Compute raw discount value from discount_type
      if (parsed.discount_type === 'percent' && parsed.subtotal > 0) {
        // Reverse: discountAmount = subtotal * percent / 100
        const percent = (parsed.discount / parsed.subtotal) * 100
        setDiscount(Math.round(percent * 100) / 100)
      } else {
        setDiscount(parsed.discount || 0)
      }
      setDiscountType(parsed.discount_type || 'amount')
      setVatEnabled(parsed.vat_enabled ?? true)
      setNotes(parsed.notes || '')
    } catch (err) {
      toast.error(`โหลดข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setLoading(false)
    }
  }, [quotationId])

  useEffect(() => {
    fetchQuotation()
  }, [fetchQuotation])

  // Refresh custom item prices from price_requests
  const refreshCustomPrices = useCallback(async () => {
    const customItems = items.filter((i) => i.is_custom && i.price_request_id)
    if (customItems.length === 0) return
    setRefreshingPrices(true)
    try {
      const res = await fetch('/api/price-requests')
      const json = await res.json()
      if (!res.ok) return
      const priceRequests: Array<{
        id: string
        status: PriceRequestStatus
        response?: { unit_price: number; total_price: number } | null
      }> = json.data ?? []

      setItems((prev) =>
        prev.map((item) => {
          if (!item.is_custom || !item.price_request_id) return item
          const pr = priceRequests.find((r) => r.id === item.price_request_id)
          if (!pr) return item
          const updated = { ...item, price_request_status: pr.status }
          if (pr.status === 'quoted' && pr.response) {
            updated.unit_price = pr.response.unit_price
            updated.total = pr.response.unit_price * item.quantity
          }
          return updated
        })
      )
    } catch {
      // ignore
    } finally {
      setRefreshingPrices(false)
    }
  }, [items])

  // Auto-refresh every 30s when there are pending custom items
  useEffect(() => {
    const hasPending = items.some(
      (i) =>
        i.is_custom &&
        (i.price_request_status === 'pending' || i.price_request_status === 'reviewing')
    )
    if (hasPending) {
      autoRefreshTimer.current = setInterval(() => {
        refreshCustomPrices()
      }, 30000)
    } else {
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current)
    }
    return () => {
      if (autoRefreshTimer.current) clearInterval(autoRefreshTimer.current)
    }
  }, [items, refreshCustomPrices])

  const addCustomItem = (item: QuotationItem) => {
    setItems((prev) => [...prev, item])
  }

  const applyQuotedPrice = (idx: number, unitPrice: number) => {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[idx], unit_price: unitPrice, total: unitPrice * next[idx].quantity }
      next[idx] = item
      return next
    })
    toast.success('ใช้ราคาจากโรงงานแล้ว')
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const discountAmount =
    discountType === 'percent' ? (subtotal * discount) / 100 : discount
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const vatAmount = vatEnabled ? afterDiscount * 0.07 : 0
  const total = afterDiscount + vatAmount

  // Item handlers
  const updateItem = (idx: number, field: keyof QuotationItem, value: string | number | null) => {
    setItems((prev) => {
      const next = [...prev]
      const item = { ...next[idx], [field]: value } as QuotationItem
      item.total = item.quantity * item.unit_price
      next[idx] = item
      return next
    })
  }

  const addItem = () => setItems((prev) => [...prev, DEFAULT_ITEM()])

  const addItemFromProduct = (product: Product) => {
    const computed = computeAreaPricing(product)
    const newItem: QuotationItem = {
      id: uuidv4(),
      name: product.name,
      description: product.price_per_sqm
        ? `${computed.price_per_sqm?.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/ตร.ม.`
        : '',
      quantity: 1,
      unit: product.unit,
      unit_price: product.price_per_unit,
      total: product.price_per_unit,
      image_url: product.image_url ?? null,
    }
    setItems((prev) => [...prev, newItem])
  }

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx))

  // Upload image
  const handleImageUpload = async (idx: number, file: File) => {
    setUploadingIdx(idx)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${uuidv4()}.${ext}`
      const { error } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)
      updateItem(idx, 'image_url', urlData.publicUrl)
    } catch (err) {
      toast.error('อัพโหลดรูปไม่สำเร็จ')
      console.error(err)
    } finally {
      setUploadingIdx(null)
    }
  }

  // Save
  const handleSave = async () => {
    if (items.some((i) => !i.name.trim())) {
      toast.error('กรุณากรอกชื่อสินค้าให้ครบ')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/quotations/${quotationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          subtotal,
          discount: discountAmount,
          discount_type: discountType,
          vat_enabled: vatEnabled,
          vat_amount: vatAmount,
          total,
          valid_until: validUntil || null,
          notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('บันทึกใบเสนอราคาสำเร็จ')
      router.push(`/quotations/${projectId}`)
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (userRole && !canAccess(userRole, 'quotations')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <span className="text-5xl mb-4">🔒</span>
        <h2 className="text-lg font-semibold text-gray-600">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-gray-400 mt-1">คุณไม่มีสิทธิ์แก้ไขใบเสนอราคา</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          กลับ
        </Button>
      </div>
    )
  }

  const issueDate = quotation?.created_at
    ? new Date(quotation.created_at).toISOString().split('T')[0]
    : ''

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/quotations/${projectId}`)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">แก้ไขใบเสนอราคา</h1>
          {quotation && (
            <p className="text-sm text-gray-500">{quotation.quotation_number}</p>
          )}
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>ข้อมูลใบเสนอราคา</span>
            {quotation?.quotation_number && (
              <Badge className="bg-sky-100 text-sky-700 border-sky-300 text-xs">
                {quotation.quotation_number}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium text-gray-700">ลูกค้า</p>
              {quotation?.projects?.customers ? (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-800">{quotation.projects.customers.name}</p>
                  {quotation.projects.customers.address && (
                    <p className="text-sm text-gray-500 mt-0.5">{quotation.projects.customers.address}</p>
                  )}
                  {quotation.projects.customers.phone && (
                    <p className="text-sm text-gray-500">โทร: {quotation.projects.customers.phone}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">ไม่มีข้อมูลลูกค้า</p>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">วันที่ออก</Label>
                <Input value={issueDate} readOnly className="bg-gray-50 text-sm" />
              </div>
              <div>
                <Label className="text-xs text-gray-500">วันหมดอายุ</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">รายการสินค้า</CardTitle>
            <div className="flex gap-2 flex-wrap justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProductPickerOpen(true)}
                className="gap-1 text-sky-700 border-sky-300 hover:bg-sky-50"
              >
                <Package className="w-3.5 h-3.5" /> เลือกจากสินค้า
              </Button>
              <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
                <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
              </Button>
              {canSendPriceRequest && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomItemOpen(true)}
                  className="gap-1 text-purple-700 border-purple-300 hover:bg-purple-50"
                >
                  <Sparkles className="w-3.5 h-3.5" /> สินค้า Custom (ขอราคา)
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Refresh custom prices bar */}
          {items.some((i) => i.is_custom) && (
            <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3">
              <span className="text-xs text-purple-700">
                {items.filter((i) => i.is_custom && (i.price_request_status === 'pending' || i.price_request_status === 'reviewing')).length > 0
                  ? '🟡 มี item รอราคาจากโรงงาน (auto-refresh ทุก 30 วิ)'
                  : '✅ Custom items ทั้งหมดได้รับราคาแล้ว'}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={refreshCustomPrices}
                disabled={refreshingPrices}
                className="h-6 px-2 text-xs text-purple-700 hover:bg-purple-100"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${refreshingPrices ? 'animate-spin' : ''}`} />
                รีเฟรชราคา
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`border rounded-lg p-3 bg-white shadow-sm ${
                  item.is_custom ? 'border-purple-200 bg-purple-50/30' : ''
                }`}
              >
                {/* Custom item badge */}
                {item.is_custom && (
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-300">
                      Custom
                    </Badge>
                    {item.price_request_status === 'pending' && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                        🟡 รอราคา
                      </Badge>
                    )}
                    {item.price_request_status === 'reviewing' && (
                      <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                        🔍 กำลังพิจารณา
                      </Badge>
                    )}
                    {item.price_request_status === 'quoted' && (
                      <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                        ✅ ได้ราคาแล้ว
                      </Badge>
                    )}
                    {item.price_request_status === 'rejected' && (
                      <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                        ❌ ปฏิเสธ
                      </Badge>
                    )}
                  </div>
                )}

                {/* Row 1: รูป + ชื่อสินค้า + ปุ่มลบ */}
                <div className="flex gap-3 mb-3">
                  {/* Image upload (60x60) — skip for custom items */}
                  {!item.is_custom && (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {item.image_url ? (
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.image_url}
                            alt=""
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'image_url', null)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors">
                          {uploadingIdx === idx ? (
                            <div className="w-4 h-4 border border-sky-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 text-gray-400" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0]
                              if (f) handleImageUpload(idx, f)
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Name + Description */}
                  <div className="flex-1 min-w-0">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder="ชื่อสินค้า *"
                      className="text-sm mb-1.5 h-9"
                      readOnly={item.is_custom}
                    />
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="รายละเอียด (ไม่จำเป็น)"
                      className="text-xs text-gray-500 h-8"
                      readOnly={item.is_custom}
                    />
                  </div>

                  {/* ปุ่มลบ */}
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={items.length === 1}
                    className="self-start p-1.5 rounded hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Row 2: จำนวน + หน่วย + ราคา/หน่วย + รวม */}
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">จำนวน</label>
                    <Input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                      }
                      className="text-right h-9"
                      readOnly={item.is_custom}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">หน่วย</label>
                    <Input
                      value={item.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                      className="h-9"
                      placeholder="แผ่น"
                      readOnly={item.is_custom}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">ราคา/หน่วย</label>
                    {item.is_custom && item.price_request_status !== 'quoted' ? (
                      <div className="h-9 flex items-center justify-center bg-yellow-50 rounded border border-yellow-200 text-xs text-yellow-700 px-2">
                        รอราคา
                      </div>
                    ) : (
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="text-right h-9"
                        readOnly={item.is_custom && item.price_request_status === 'quoted'}
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">รวม (บาท)</label>
                    <div className="h-9 flex items-center justify-end font-semibold text-green-700 bg-gray-50 rounded border px-2">
                      {formatCurrency(item.total)}
                    </div>
                  </div>
                </div>

                {/* Custom item quoted: ปุ่ม "ใช้ราคานี้" */}
                {item.is_custom && item.price_request_status === 'quoted' && item.unit_price > 0 && (
                  <div className="mt-2 flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-green-700">
                      💰 ราคาจากโรงงาน: {formatCurrency(item.unit_price)} บาท/{item.unit}
                    </span>
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs text-white bg-green-600 hover:bg-green-700"
                      onClick={() => applyQuotedPrice(idx, item.unit_price)}
                    >
                      ใช้ราคานี้
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary + Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุ เงื่อนไข หรือข้อตกลง..."
              rows={5}
              className="text-sm"
            />
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">สรุปยอด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">รวมก่อนหักส่วนลด</span>
              <span className="font-medium">{formatCurrency(subtotal)} บาท</span>
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">ส่วนลด</Label>
              <div className="flex gap-2">
                <div className="flex border rounded-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDiscountType('amount')}
                    className={`px-3 py-1.5 text-xs ${
                      discountType === 'amount'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    บาท
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-3 py-1.5 text-xs border-l ${
                      discountType === 'percent'
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    %
                  </button>
                </div>
                <Input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? 100 : undefined}
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="flex-1 text-sm h-8"
                />
              </div>
              {discountAmount > 0 && (
                <p className="text-xs text-red-500">
                  หักส่วนลด: -{formatCurrency(discountAmount)} บาท
                </p>
              )}
            </div>

            {/* VAT toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ภาษีมูลค่าเพิ่ม 7%</p>
                {vatEnabled && (
                  <p className="text-xs text-gray-400">{formatCurrency(vatAmount)} บาท</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setVatEnabled((v) => !v)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  vatEnabled ? 'bg-sky-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    vatEnabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-800">ยอดรวมสุทธิ</span>
              <span className="text-2xl font-bold" style={{ color: '#2BA8D4' }}>
                {formatCurrency(total)}
                <span className="text-sm ml-1 font-normal text-gray-500">บาท</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Picker */}
      <ProductPickerModal
        open={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        onSelect={addItemFromProduct}
      />

      {/* Custom Item Dialog */}
      <CustomItemDialog
        open={customItemOpen}
        quotationId={quotationId}
        projectId={quotation?.project_id ?? null}
        userRole={userRole}
        onClose={() => setCustomItemOpen(false)}
        onAdded={addCustomItem}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pb-8">
        <Button variant="outline" onClick={() => router.push(`/quotations/${projectId}`)} disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          style={{ backgroundColor: '#2BA8D4' }}
          className="text-white gap-2"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          บันทึกการแก้ไข
        </Button>
      </div>
    </div>
  )
}
