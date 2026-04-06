'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Plus, Trash2, Upload, X } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { QuotationItem } from '@/types/quotation'
import type { CRMProject } from '@/types/crm'

function generateQuotationNumber(): string {
  const now = new Date()
  const dateStr = format(now, 'yyyyMMdd')
  const rand = Math.floor(Math.random() * 900) + 100
  return `QT-${dateStr}-${rand}`
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v)
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

export default function NewQuotationPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [project, setProject] = useState<CRMProject | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [quotationNumber] = useState(generateQuotationNumber())
  const [issueDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [validUntil, setValidUntil] = useState(
    format(addDays(new Date(), 30), 'yyyy-MM-dd')
  )
  const [items, setItems] = useState<QuotationItem[]>([DEFAULT_ITEM()])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount')
  const [vatEnabled, setVatEnabled] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`)
      const json = await res.json()
      if (res.ok) setProject(json.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

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
  const handleSave = async (status: 'draft' | 'sent' = 'draft') => {
    if (items.some((i) => !i.name.trim())) {
      toast.error('กรุณากรอกชื่อสินค้าให้ครบ')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          quotation_number: quotationNumber,
          items,
          subtotal,
          discount: discountAmount,
          discount_type: discountType,
          vat_enabled: vatEnabled,
          vat_amount: vatAmount,
          total,
          status,
          valid_until: validUntil,
          notes,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('บันทึกใบเสนอราคาสำเร็จ')
      router.push(`/projects/${projectId}`)
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">สร้างใบเสนอราคา</h1>
          {project && (
            <p className="text-sm text-gray-500">{project.name}</p>
          )}
        </div>
      </div>

      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span>ข้อมูลใบเสนอราคา</span>
            <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
              {quotationNumber}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Customer */}
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium text-gray-700">ลูกค้า</p>
              {project?.customers ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="font-semibold text-gray-800">{project.customers.name}</p>
                  {project.customers.address && (
                    <p className="text-sm text-gray-500 mt-0.5">{project.customers.address}</p>
                  )}
                  {project.customers.phone && (
                    <p className="text-sm text-gray-500">โทร: {project.customers.phone}</p>
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
            <Button size="sm" variant="outline" onClick={addItem} className="gap-1">
              <Plus className="w-3.5 h-3.5" /> เพิ่มรายการ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-3 py-2 text-left text-xs text-gray-500 w-10">#</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 w-16">รูป</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500">ชื่อสินค้า / รายละเอียด</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 w-24">จำนวน</th>
                  <th className="px-3 py-2 text-left text-xs text-gray-500 w-20">หน่วย</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 w-28">ราคา/หน่วย</th>
                  <th className="px-3 py-2 text-right text-xs text-gray-500 w-28">รวม</th>
                  <th className="px-1 py-2 w-8" />
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center text-gray-400">{idx + 1}</td>

                    {/* Image upload */}
                    <td className="px-3 py-2">
                      <div className="relative w-12 h-12">
                        {item.image_url ? (
                          <div className="relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
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
                          <label className="w-12 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors">
                            {uploadingIdx === idx ? (
                              <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5 text-gray-400" />
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
                    </td>

                    {/* Name + Description */}
                    <td className="px-3 py-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder="ชื่อสินค้า *"
                        className="text-sm mb-1 h-8"
                      />
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        placeholder="รายละเอียด (ไม่จำเป็น)"
                        className="text-xs text-gray-500 h-7"
                      />
                    </td>

                    {/* Quantity */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="text-sm text-right h-8"
                      />
                    </td>

                    {/* Unit */}
                    <td className="px-3 py-2">
                      <Input
                        value={item.unit}
                        onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                        className="text-sm h-8"
                        placeholder="หน่วย"
                      />
                    </td>

                    {/* Unit price */}
                    <td className="px-3 py-2">
                      <Input
                        type="number"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) =>
                          updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)
                        }
                        className="text-sm text-right h-8"
                      />
                    </td>

                    {/* Total */}
                    <td className="px-3 py-2 text-right font-semibold text-gray-700">
                      {formatCurrency(item.total)}
                    </td>

                    {/* Delete */}
                    <td className="px-1 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={items.length === 1}
                        onClick={() => removeItem(idx)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        ? 'bg-amber-600 text-white'
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
                        ? 'bg-amber-600 text-white'
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
                  vatEnabled ? 'bg-amber-500' : 'bg-gray-300'
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
              <span className="text-2xl font-bold" style={{ color: '#7B4F2E' }}>
                {formatCurrency(total)}
                <span className="text-sm ml-1 font-normal text-gray-500">บาท</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pb-8">
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          ยกเลิก
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave('draft')}
          disabled={saving}
          className="gap-2"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border border-gray-500 border-t-transparent rounded-full animate-spin" />
          ) : null}
          บันทึก Draft
        </Button>
        <Button
          onClick={() => handleSave('sent')}
          disabled={saving}
          style={{ backgroundColor: '#7B4F2E' }}
          className="text-white gap-2"
        >
          ส่งใบเสนอราคา
        </Button>
      </div>
    </div>
  )
}
