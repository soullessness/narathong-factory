'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductCategory } from '@/types/product'
import { computeAreaPricing } from '@/types/product'

interface ProductDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  product?: Product | null
  categories: ProductCategory[]
}

export function ProductDialog({ open, onClose, onSaved, product, categories }: ProductDialogProps) {
  const [categoryId, setCategoryId] = useState<string>('')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [unit, setUnit] = useState('แผ่น')
  const [pricePerUnit, setPricePerUnit] = useState<number>(0)
  const [widthInch, setWidthInch] = useState<number | ''>('')
  const [lengthM, setLengthM] = useState<number | ''>('')
  const [piecesPerPack, setPiecesPerPack] = useState<number | ''>('')
  const [pricePerPack, setPricePerPack] = useState<number | ''>('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const handleCategoryChange = (value: string | null) => setCategoryId(value ?? '')
  const handleUnitChange = (value: string | null) => setUnit(value ?? 'แผ่น')
  const hasAreaPricing = selectedCategory?.has_area_pricing ?? false

  // Derived area pricing preview
  const widthMm = typeof widthInch === 'number' ? widthInch * 25.4 : null
  const computed = widthMm && typeof lengthM === 'number'
    ? computeAreaPricing({
        id: '', category_id: null, name: '', unit: '', price_per_unit: pricePerUnit,
        width_mm: widthMm, length_m: lengthM, is_active: true, created_at: '', updated_at: '',
      })
    : null

  useEffect(() => {
    if (open) {
      setCategoryId(product?.category_id ?? '')
      setName(product?.name ?? '')
      setSku(product?.sku ?? '')
      setDescription(product?.description ?? '')
      setImageUrl(product?.image_url ?? '')
      setUnit(product?.unit ?? 'แผ่น')
      setPricePerUnit(product?.price_per_unit ?? 0)
      // Convert mm back to inch for editing
      setWidthInch(product?.width_mm ? parseFloat((product.width_mm / 25.4).toFixed(2)) : '')
      setLengthM(product?.length_m ?? '')
      setPiecesPerPack(product?.pieces_per_pack ?? '')
      setPricePerPack(product?.price_per_pack ?? '')
    }
  }, [open, product])

  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const path = `${uuidv4()}.${ext}`
      const { error } = await supabase.storage.from('product-images').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
      setImageUrl(urlData.publicUrl)
    } catch (err) {
      toast.error('อัพโหลดรูปไม่สำเร็จ')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อสินค้า')
      return
    }
    setSaving(true)
    try {
      const isEdit = !!product
      const url = isEdit ? `/api/products/${product!.id}` : '/api/products'
      const widthMmVal = typeof widthInch === 'number' ? parseFloat((widthInch * 25.4).toFixed(2)) : null
      const body = {
        category_id: categoryId || null,
        name: name.trim(),
        description: description.trim() || null,
        sku: sku.trim() || null,
        image_url: imageUrl || null,
        unit,
        price_per_unit: pricePerUnit,
        width_mm: hasAreaPricing ? widthMmVal : null,
        length_m: hasAreaPricing && typeof lengthM === 'number' ? lengthM : null,
        pieces_per_pack: hasAreaPricing && typeof piecesPerPack === 'number' ? piecesPerPack : null,
        price_per_pack: hasAreaPricing && typeof pricePerPack === 'number' ? pricePerPack : null,
        is_active: true,
      }
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(isEdit ? 'แก้ไขสินค้าสำเร็จ' : 'เพิ่มสินค้าสำเร็จ')
      onSaved()
      onClose()
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Category */}
          <div className="space-y-1.5">
            <Label>หมวดหมู่สินค้า</Label>
            <Select value={categoryId} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหมวดหมู่" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>ชื่อสินค้า *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ไม้สักเนื้อดี 6 นิ้ว" />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label>รหัสสินค้า (SKU)</Label>
              <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="เช่น WD-TEAK-6" />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>รายละเอียด</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม..."
              rows={2}
              className="text-sm"
            />
          </div>

          {/* Image upload */}
          <div className="space-y-1.5">
            <Label>รูปสินค้า</Label>
            {imageUrl ? (
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="w-20 h-20 object-cover rounded-lg border" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl('')}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-1" /> ลบรูป
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-colors w-fit">
                {uploading ? (
                  <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-sm text-gray-500">{uploading ? 'กำลังอัพโหลด...' : 'อัพโหลดรูปภาพ'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f) }}
                />
              </label>
            )}
          </div>

          {/* Price + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ราคาต่อหน่วย (บาท) *</Label>
              <Input
                type="number"
                min="0"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>หน่วย</Label>
              <Select value={unit} onValueChange={handleUnitChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="แผ่น">แผ่น</SelectItem>
                  <SelectItem value="เมตร">เมตร</SelectItem>
                  <SelectItem value="ชิ้น">ชิ้น</SelectItem>
                  <SelectItem value="อัน">อัน</SelectItem>
                  <SelectItem value="ชุด">ชุด</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Area pricing fields */}
          {hasAreaPricing && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-800">📐 ข้อมูลขนาด (สำหรับคำนวณราคา/ตร.ม.)</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">ความกว้าง (นิ้ว)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.25"
                    value={widthInch}
                    onChange={(e) => setWidthInch(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="เช่น 6"
                  />
                  {typeof widthInch === 'number' && widthInch > 0 && (
                    <p className="text-xs text-gray-500">= {(widthInch * 25.4).toFixed(1)} มม.</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ความยาว (เมตร)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="เช่น 1.8"
                  />
                </div>
              </div>

              {/* Preview calculation */}
              {computed?.area_per_piece && computed.pieces_per_sqm && computed.price_per_sqm && (
                <div className="bg-white border border-amber-300 rounded-md p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">📊 ผลคำนวณอัตโนมัติ</p>
                  <p className="text-sm text-gray-700">
                    1 แผ่น ={' '}
                    <strong>{computed.area_per_piece.toFixed(4)}</strong> ตร.ม.
                    {' | '}ต้องใช้ <strong>{computed.pieces_per_sqm.toFixed(2)}</strong> แผ่น/ตร.ม.
                    {' | '}ราคา <strong style={{ color: '#7B4F2E' }}>
                      {computed.price_per_sqm.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>{' '}บาท/ตร.ม.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">จำนวนแผ่น/แพ็ค (ไม่จำเป็น)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={piecesPerPack}
                    onChange={(e) => setPiecesPerPack(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="เช่น 10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">ราคา/แพ็ค (ไม่จำเป็น)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={pricePerPack}
                    onChange={(e) => setPricePerPack(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="บาท"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>ยกเลิก</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: '#7B4F2E' }}
              className="text-white"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
