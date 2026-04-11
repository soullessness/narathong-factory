'use client'

import { useEffect, useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  manager: 'ผู้จัดการ',
  factory_head: 'หัวหน้าโรงงาน',
  sales: 'พนักงานขาย',
  cashier: 'แคชเชียร์',
}

const ROLES = ['admin', 'manager', 'factory_head', 'sales', 'cashier'] as const

interface Department {
  id: string
  name: string
}

interface UserFormData {
  id?: string
  email?: string
  full_name: string
  role: string
  department_id?: string | null
  phone?: string | null
  is_active?: boolean
}

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: UserFormData | null
  onSuccess: () => void
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
  const isEdit = !!user?.id
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('sales')
  const [departmentId, setDepartmentId] = useState<string>('none')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load departments
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((json) => setDepartments(json.data ?? []))
      .catch(() => {})
  }, [])

  // Fill form when editing
  useEffect(() => {
    if (open) {
      if (user) {
        setFullName(user.full_name ?? '')
        setEmail(user.email ?? '')
        setRole(user.role ?? 'sales')
        setDepartmentId(user.department_id ?? 'none')
        setPhone(user.phone ?? '')
        setIsActive(user.is_active ?? true)
      } else {
        setFullName('')
        setEmail('')
        setRole('sales')
        setDepartmentId('none')
        setPhone('')
        setIsActive(true)
      }
      setPassword('')
      setErrors({})
    }
  }, [open, user])

  function validate() {
    const errs: Record<string, string> = {}
    if (!fullName.trim()) errs.full_name = 'กรุณากรอกชื่อ-นามสกุล'
    if (!isEdit) {
      if (!email.trim()) errs.email = 'กรุณากรอกอีเมล'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'รูปแบบอีเมลไม่ถูกต้อง'
      if (!password) errs.password = 'กรุณากรอกรหัสผ่าน'
      else if (password.length < 8) errs.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    } else {
      if (password && password.length < 8) errs.password = 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'
    }
    if (!role) errs.role = 'กรุณาเลือก Role'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        role,
        department_id: departmentId === 'none' ? null : departmentId || null,
        phone: phone.trim() || null,
      }
      if (!isEdit) {
        payload.email = email.trim()
        payload.password = password
      } else {
        if (password) payload.password = password
        payload.is_active = isActive
      }

      const url = isEdit ? `/api/admin/users/${user!.id}` : '/api/admin/users'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'เกิดข้อผิดพลาด')
        return
      }
      toast.success(isEdit ? 'อัปเดตผู้ใช้สำเร็จ' : 'สร้างผู้ใช้ใหม่สำเร็จ')
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1">
            <Label htmlFor="full_name">
              ชื่อ-นามสกุล <span className="text-red-500">*</span>
            </Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ชื่อ นามสกุล"
            />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
          </div>

          {/* Email — create only */}
          {!isEdit && (
            <div className="space-y-1">
              <Label htmlFor="email">
                อีเมล <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
          )}

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">
              รหัสผ่าน {!isEdit && <span className="text-red-500">*</span>}
              {isEdit && <span className="text-gray-400 text-xs"> (เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'อย่างน้อย 8 ตัวอักษร'}
            />
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label>
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={role} onValueChange={(v) => setRole(v ?? 'sales')}>
              <SelectTrigger>
                <SelectValue placeholder="เลือก Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
          </div>

          {/* Department */}
          <div className="space-y-1">
            <Label>แผนก</Label>
            <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? 'none')}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกแผนก (ถ้ามี)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">ไม่ระบุแผนก</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0XX-XXX-XXXX"
            />
          </div>

          {/* Active toggle — edit only */}
          {isEdit && (
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">สถานะ Active</Label>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#7B4F2E' }}
              className="text-white"
            >
              {loading ? 'กำลังบันทึก...' : isEdit ? 'บันทึก' : 'สร้างผู้ใช้'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
