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
import { UserPlus } from 'lucide-react'
import {
  CRMProject,
  Customer,
  Profile,
  CRMStage,
  STAGE_CONFIG,
  STAGE_ORDER,
  CreateProjectInput,
} from '@/types/crm'
import { AddCustomerDialog } from './AddCustomerDialog'

interface ProjectDialogProps {
  open: boolean
  onClose: () => void
  onSaved: (project: CRMProject) => void
  initialStage?: CRMStage
  editProject?: CRMProject | null
}

export function ProjectDialog({
  open,
  onClose,
  onSaved,
  initialStage = 'lead',
  editProject,
}: ProjectDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [salesProfiles, setSalesProfiles] = useState<Profile[]>([])
  const [showAddCustomer, setShowAddCustomer] = useState(false)

  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    customer_id: undefined,
    stage: initialStage,
    value: undefined,
    deposit_amount: undefined,
    deadline: '',
    assigned_sales: undefined,
    notes: '',
  })

  useEffect(() => {
    if (open) {
      fetchCustomers()
      fetchSalesProfiles()
      if (editProject) {
        setForm({
          name: editProject.name,
          customer_id: editProject.customer_id || undefined,
          stage: editProject.stage,
          value: editProject.value ?? undefined,
          deposit_amount: editProject.deposit_amount ?? undefined,
          deadline: editProject.deadline || '',
          assigned_sales: editProject.assigned_sales || undefined,
          notes: editProject.notes || '',
        })
      } else {
        setForm({
          name: '',
          customer_id: undefined,
          stage: initialStage,
          value: undefined,
          deposit_amount: undefined,
          deadline: '',
          assigned_sales: undefined,
          notes: '',
        })
      }
    }
  }, [open, editProject, initialStage])

  const fetchCustomers = async () => {
    const res = await fetch('/api/customers')
    if (res.ok) {
      const json = await res.json()
      setCustomers(json.data || [])
    }
  }

  const fetchSalesProfiles = async () => {
    // We'll use a simple Supabase client call pattern via API
    try {
      const res = await fetch('/api/profiles?role=sales')
      if (res.ok) {
        const json = await res.json()
        setSalesProfiles(json.data || [])
      }
    } catch {
      // profiles might not have dedicated API, skip
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('กรุณากรอกชื่อโปรเจค')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...form,
        customer_id: form.customer_id || undefined,
        assigned_sales: form.assigned_sales || undefined,
        deadline: form.deadline || undefined,
      }

      let res: Response
      if (editProject) {
        res = await fetch(`/api/projects/${editProject.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'เกิดข้อผิดพลาด')
        return
      }
      onSaved(json.data)
      handleClose()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError(null)
    onClose()
  }

  const handleCustomerCreated = (customer: Customer) => {
    setCustomers((prev) => [...prev, customer])
    setForm((f) => ({ ...f, customer_id: customer.id }))
    setShowAddCustomer(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProject ? 'แก้ไขโปรเจค' : 'เพิ่มโปรเจคใหม่'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="proj-name">
                ชื่อโปรเจค <span className="text-red-500">*</span>
              </Label>
              <Input
                id="proj-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ชื่อโปรเจค"
                required
              />
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <Label htmlFor="proj-customer">ลูกค้า</Label>
              <div className="flex gap-2">
                <Select
                  value={form.customer_id || 'none'}
                  onValueChange={(v) => setForm((f) => ({ ...f, customer_id: (!v || v === 'none') ? undefined : v }))}
                >
                  <SelectTrigger id="proj-customer" className="flex-1">
                    <SelectValue placeholder="เลือกลูกค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— ไม่ระบุ —</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCustomer(true)}
                  title="เพิ่มลูกค้าใหม่"
                >
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Stage */}
            <div className="space-y-2">
              <Label htmlFor="proj-stage">Stage</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => setForm((f) => ({ ...f, stage: v as CRMStage }))}
              >
                <SelectTrigger id="proj-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STAGE_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Value + Deposit */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="proj-value">มูลค่าโปรเจค (บาท)</Label>
                <Input
                  id="proj-value"
                  type="number"
                  min="0"
                  value={form.value ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      value: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-deposit">มัดจำ (บาท)</Label>
                <Input
                  id="proj-deposit"
                  type="number"
                  min="0"
                  value={form.deposit_amount ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      deposit_amount: e.target.value ? parseFloat(e.target.value) : undefined,
                    }))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="proj-deadline">กำหนดส่ง</Label>
              <Input
                id="proj-deadline"
                type="date"
                value={form.deadline || ''}
                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              />
            </div>

            {/* Assigned Sales */}
            {salesProfiles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="proj-sales">Sales ที่รับผิดชอบ</Label>
                <Select
                  value={form.assigned_sales || 'none'}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, assigned_sales: (!v || v === 'none') ? undefined : v }))
                  }
                >
                  <SelectTrigger id="proj-sales">
                    <SelectValue placeholder="เลือก Sales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— ไม่ระบุ —</SelectItem>
                    {salesProfiles.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="proj-notes">หมายเหตุ</Label>
              <Textarea
                id="proj-notes"
                value={form.notes || ''}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="หมายเหตุเพิ่มเติม"
                rows={3}
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
                style={{ backgroundColor: '#7B4F2E' }}
                className="text-white"
              >
                {loading ? 'กำลังบันทึก...' : editProject ? 'บันทึกการแก้ไข' : 'เพิ่มโปรเจค'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddCustomerDialog
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onCreated={handleCustomerCreated}
      />
    </>
  )
}
