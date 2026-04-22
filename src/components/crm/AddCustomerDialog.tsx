'use client'

import { useState, useEffect } from 'react'
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
import { Customer, CreateCustomerInput } from '@/types/crm'
import { createClient } from '@/lib/supabase/client'

interface AddCustomerDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (customer: Customer) => void
}

export function AddCustomerDialog({ open, onClose, onCreated }: AddCustomerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customerTypes, setCustomerTypes] = useState<{name: string, description: string}[]>([])
  const [form, setForm] = useState<CreateCustomerInput>({
    name: '',
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    customer_type: 'retail',
  })

  const supabase = createClient()

  useEffect(() => {
    const loadTypes = async () => {
      const { data } = await supabase.from('customer_types').select('name,description').eq('is_active', true).order('sort_order')
      if (data) setCustomerTypes(data)
    }
    loadTypes()
  }, [])

  useEffect(() => {
    if (!open) {
      setForm({
        name: '',
        contact_name: '',
        phone: '',
        email: '',
        address: '',
        customer_type: 'retail',
      })
      setError(null)
    }
  }, [open])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อลูกค้า')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({
          name: form.name,
          contact_name: form.contact_name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          customer_type: form.customer_type,
        })
        .select()
        .single()

      if (insertError) throw insertError

      if (data) {
        onCreated(data as Customer)
        onClose()
      }
    } catch (err: unknown) {
      console.error('Create customer error:', err)
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>เพิ่มลูกค้าใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>ชื่อลูกค้า *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ชื่อลูกค้า"
            />
          </div>

          <div>
            <Label>ผู้ติดต่อ</Label>
            <Input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              placeholder="ชื่อผู้ติดต่อ"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>เบอร์โทร</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="เบอร์โทร"
              />
            </div>

            <div>
              <Label>ประเภทลูกค้า</Label>
              <Select
                value={form.customer_type}
                onValueChange={(v) => setForm({ ...form, customer_type: v as 'retail' | 'contractor' | 'developer' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customerTypes.map((t) => (
                    <SelectItem key={t.name} value={t.name}>
                      {t.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>อีเมล</Label>
            <Input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
              type="email"
            />
          </div>

          <div>
            <Label>ที่อยู่</Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="ที่อยู่ลูกค้า"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
