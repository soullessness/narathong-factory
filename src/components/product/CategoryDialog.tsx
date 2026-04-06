'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ProductCategory } from '@/types/product'

interface CategoryDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  category?: ProductCategory | null
}

export function CategoryDialog({ open, onClose, onSaved, category }: CategoryDialogProps) {
  const [name, setName] = useState('')
  const [hasAreaPricing, setHasAreaPricing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(category?.name ?? '')
      setHasAreaPricing(category?.has_area_pricing ?? false)
    }
  }, [open, category])

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่')
      return
    }
    setSaving(true)
    try {
      const isEdit = !!category
      const url = isEdit ? `/api/product-categories/${category!.id}` : '/api/product-categories'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), has_area_pricing: hasAreaPricing }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(isEdit ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ')
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{category ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>ชื่อหมวดหมู่ *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ไม้พื้น, ประตู"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">คำนวณราคา/ตร.ม.</p>
              <p className="text-xs text-gray-500">สำหรับ พื้น/ผนัง/ฝ้า ที่มีขนาด</p>
            </div>
            <button
              type="button"
              onClick={() => setHasAreaPricing((v) => !v)}
              className={`relative w-10 h-5 rounded-full transition-colors ${hasAreaPricing ? 'bg-amber-500' : 'bg-gray-300'}`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${hasAreaPricing ? 'translate-x-5' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
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
