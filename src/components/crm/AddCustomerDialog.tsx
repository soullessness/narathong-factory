'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Customer, CreateCustomerInput, CUSTOMER_TYPE_LABELS } from '@/types/crm'

interface AddCustomerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (customer: Customer) => void
}

export function AddCustomerDialog({ open, onClose, onCreated }: AddCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateCustomerInput>({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'retail',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อลูกค้า')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'เกิดข้อผิดพลาด')
        return
      }
      onCreated(json.data)
      handleClose()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm({
      name: '',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      customer_type: 'retail',
    })
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cust-name">
              ชื่อบริษัท/ลูกค้า <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cust-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="ชื่อบริษัท หรือชื่อลูกค้า"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-contact">ชื่อผู้ติดต่อ</Label>
            <Input
              id="cust-contact"
              value={form.contact_name}
              onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
              placeholder="ชื่อ-นามสกุลผู้ติดต่อ"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cust-phone">เบอร์โทร</Label>
              <Input
                id="cust-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="0XX-XXX-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-type">ประเภทลูกค้า</Label>
            <Select
              value={form.customer_type}
              onValueChange={(v) =>
                setForm((f) => ({
                  ...f,
                  customer_type: v as 'retail' | 'contractor' | 'developer',
                }))
              }
            >
              <SelectTrigger id="cust-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CUSTOMER_TYPE_LABELS).map(([val, label]) => (
                  <SelectItem key={val} value={val}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-address">ที่อยู่</Label>
            <Textarea
              id="cust-address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="ที่อยู่ลูกค้า"
              rows={2}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2BA8D4' }}
              className="text-white"
            >
              {loading ? 'กำลังบันทึก...' : 'เพิ่มลูกค้า'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
