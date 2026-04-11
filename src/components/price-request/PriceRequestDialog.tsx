'use client'

import { useState, useEffect } from 'react'
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

interface Project {
  id: string
  name: string
}

interface Quotation {
  id: string
  quotation_number: string
  project_id: string
}

interface PriceRequestDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const PRODUCT_TYPES = Object.entries(PRODUCT_TYPE_LABELS) as [ProductType, string][]

export function PriceRequestDialog({ open, onClose, onSaved }: PriceRequestDialogProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [quotations, setQuotations] = useState<Quotation[]>([])

  const [form, setForm] = useState({
    product_type: '' as ProductType | '',
    product_name: '',
    spec: '',
    quantity: '',
    unit: '',
    deadline_date: '',
    project_id: '',
    quotation_id: '',
  })

  useEffect(() => {
    if (!open) return
    // Load projects
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => setProjects(json.data ?? []))
      .catch(() => {})
    // Load quotations
    fetch('/api/quotations')
      .then((r) => r.json())
      .then((json) => setQuotations(json.data ?? []))
      .catch(() => {})
  }, [open])

  const handleClose = () => {
    setForm({
      product_type: '',
      product_name: '',
      spec: '',
      quantity: '',
      unit: '',
      deadline_date: '',
      project_id: '',
      quotation_id: '',
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
          project_id: form.project_id && form.project_id !== 'none' ? form.project_id : null,
          quotation_id: form.quotation_id && form.quotation_id !== 'none' ? form.quotation_id : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      toast.success('ส่งคำขอราคาสำเร็จ')
      onSaved()
      handleClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  // Filter quotations by selected project
  const filteredQuotations =
    form.project_id && form.project_id !== 'none'
      ? quotations.filter((q) => q.project_id === form.project_id)
      : quotations

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: '#7B4F2E' }}>
            ขอราคาสินค้า Custom
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Product Type */}
          <div className="space-y-1.5">
            <Label>ประเภทสินค้า <span className="text-red-500">*</span></Label>
            <Select
              value={form.product_type}
              onValueChange={(v) => setForm((f) => ({ ...f, product_type: (v ?? '') as ProductType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกประเภทสินค้า" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map(([val, label]) => (
                  <SelectItem key={val} value={val}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product Name */}
          <div className="space-y-1.5">
            <Label>ชื่อสินค้า <span className="text-red-500">*</span></Label>
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
              <Label>จำนวน <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={1}
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>หน่วย <span className="text-red-500">*</span></Label>
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

          {/* Project */}
          <div className="space-y-1.5">
            <Label>โปรเจค (ไม่บังคับ)</Label>
            <Select
              value={form.project_id}
              onValueChange={(v) => {
                const val = v ?? ''
                setForm((f) => ({ ...f, project_id: val, quotation_id: '' }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกโปรเจค" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quotation */}
          <div className="space-y-1.5">
            <Label>ใบเสนอราคา (ไม่บังคับ)</Label>
            <Select
              value={form.quotation_id}
              onValueChange={(v) => setForm((f) => ({ ...f, quotation_id: v ?? '' }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="เลือกใบเสนอราคา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุ</SelectItem>
                {filteredQuotations.map((q) => (
                  <SelectItem key={q.id} value={q.id}>{q.quotation_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            className="flex-1 text-white"
            style={{ backgroundColor: '#7B4F2E' }}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
