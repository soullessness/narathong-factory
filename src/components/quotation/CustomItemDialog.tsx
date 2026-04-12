'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PRODUCT_TYPE_LABELS, ProductType } from '@/types/price-request'
import type { QuotationItem } from '@/types/quotation'

const ALLOWED_ROLES = ['admin', 'executive', 'factory_manager', 'accounting']

interface CustomItemDialogProps {
  open: boolean
  quotationId: string
  projectId?: string | null
  /** Role of the current user — used to hide the dialog for unauthorized roles (e.g. sales) */
  userRole?: string
  onClose: () => void
  /** Called with newly created QuotationItem (with is_custom=true) */
  onAdded: (item: QuotationItem) => void
}

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]

export function CustomItemDialog({
  open,
  quotationId,
  projectId,
  userRole,
  onClose,
  onAdded,
}: CustomItemDialogProps) {
  // If role is not in allowed list, render nothing
  if (userRole !== undefined && !ALLOWED_ROLES.includes(userRole)) {
    return null
  }
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    product_type: '' as ProductType | '',
    product_name: '',
    spec: '',
    quantity: '',
    unit: '',
    deadline_date: '',
  })

  const handleClose = () => {
    setForm({
      product_type: '',
      product_name: '',
      spec: '',
      quantity: '',
      unit: '',
      deadline_date: '',
    })
    onClose()
  }

  const handleSubmit = async () => {
    if (!form.product_type || !form.product_name || !form.quantity || !form.unit) {
      toast.error('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/price-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_type: form.product_type,
          product_name: form.product_name,
          spec: form.spec || null,
          quantity: Number(form.quantity),
          unit: form.unit,
          deadline_date: form.deadline_date || null,
          project_id: projectId || null,
          quotation_id: quotationId,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      const json = await res.json()
      const priceRequest = json.data

      // Build a QuotationItem for the builder list
      const newItem: QuotationItem = {
        id: uuidv4(),
        name: form.product_name,
        description: form.spec || '',
        quantity: Number(form.quantity),
        unit: form.unit,
        unit_price: 0,
        total: 0,
        image_url: null,
        is_custom: true,
        price_request_id: priceRequest.id,
        price_request_status: 'pending',
      }

      toast.success('ส่งคำขอราคาสำเร็จ รอโรงงานตอบกลับ')
      onAdded(newItem)
      handleClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: '#7B4F2E' }}>
            + สินค้า Custom (ขอราคา)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product Type */}
          <div className="space-y-1.5">
            <Label>
              ประเภทสินค้า <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.product_type}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, product_type: (v ?? '') as ProductType }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label>
              ชื่อสินค้า <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="เช่น ประตูไม้สัก บานเปิด 80x200"
              value={form.product_name}
              onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
            />
          </div>

          {/* Spec */}
          <div className="space-y-1.5">
            <Label>รายละเอียดสเปค</Label>
            <Textarea
              placeholder="ระบุสเปคเพิ่มเติม เช่น ขนาด, วัสดุ, การเคลือบผิว"
              value={form.spec}
              onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>
                จำนวน <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                หน่วย <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="เช่น บาน, ชิ้น, ม."
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label>กำหนดวันที่ต้องการ</Label>
            <Input
              type="date"
              value={form.deadline_date}
              onChange={(e) => setForm((f) => ({ ...f, deadline_date: e.target.value }))}
            />
          </div>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
          💡 item นี้จะถูกเพิ่มในใบเสนอราคาด้วยราคา ฿0 และแสดง badge &quot;รอราคา&quot; จนกว่าโรงงานจะตอบกลับ
        </p>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={loading}
          >
            ยกเลิก
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: '#7B4F2E' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'กำลังส่ง...' : 'ส่งขอราคา + เพิ่ม Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
