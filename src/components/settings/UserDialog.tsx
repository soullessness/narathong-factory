'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
} from 'lucide-react'

const ROLE_DEPARTMENT_FILTER: Record<string, string[]> = {
  admin: [], // ทุกแผนก (ไม่จำกัด)
  executive: ['ผู้บริหาร'],
  factory_manager: ['โรงงานนราทองพลัส', 'โรงงานนราทองซอว์มิลล์'],
  team_lead: [
    'ทีมเตรียมไม้ (พลัส)',
    'ทีมช่างไม้ (พลัส)',
    'ทีมช่างพ่นสี (พลัส)',
    'ทีมประกอบ (พลัส)',
    'ทีมแพคกิ้ง (พลัส)',
    'ทีมเตรียมไม้ (ซอว์มิลล์)',
    'ทีมช่างไม้ (ซอว์มิลล์)',
    'ทีมแปรรูป (ซอว์มิลล์)',
    'ทีมแพคกิ้ง (ซอว์มิลล์)',
  ],
  worker: [
    'ทีมเตรียมไม้ (พลัส)',
    'ทีมช่างไม้ (พลัส)',
    'ทีมช่างพ่นสี (พลัส)',
    'ทีมประกอบ (พลัส)',
    'ทีมแพคกิ้ง (พลัส)',
    'ทีมเตรียมไม้ (ซอว์มิลล์)',
    'ทีมช่างไม้ (ซอว์มิลล์)',
    'ทีมแปรรูป (ซอว์มิลล์)',
    'ทีมแพคกิ้ง (ซอว์มิลล์)',
  ],
  sales: ['ฝ่ายขาย'],
  accounting: ['ฝ่ายบัญชี'],
}

export const ROLE_LABELS: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ',
  executive: 'ผู้บริหาร',
  factory_manager: 'ผู้จัดการโรงงาน',
  team_lead: 'หัวหน้าทีม',
  worker: 'พนักงานโรงงาน',
  sales: 'พนักงานขาย',
  accounting: 'บัญชี',
}

const ROLES = [
  { value: 'admin', label: 'ผู้ดูแลระบบ' },
  { value: 'executive', label: 'ผู้บริหาร' },
  { value: 'factory_manager', label: 'ผู้จัดการโรงงาน' },
  { value: 'team_lead', label: 'หัวหน้าทีม' },
  { value: 'worker', label: 'พนักงานโรงงาน' },
  { value: 'sales', label: 'พนักงานขาย' },
  { value: 'accounting', label: 'บัญชี' },
]

interface Department {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  department_id: string
}

interface UserFormData {
  id?: string
  email?: string
  full_name: string
  role: string
  department_id?: string | null
  team_id?: string | null
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
  const [teams, setTeams] = useState<Team[]>([])

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('sales')
  const [departmentId, setDepartmentId] = useState<string>('none')
  const [teamId, setTeamId] = useState<string>('none')
  const [phone, setPhone] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Show team field only for worker and team_lead roles
  const showTeamField = ['worker', 'team_lead'].includes(role)

  // Load departments
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((json) => setDepartments(json.data ?? []))
      .catch(() => {})
  }, [])

  // Load teams filtered by department
  useEffect(() => {
    if (!departmentId || departmentId === 'none' || !showTeamField) {
      setTeams([])
      return
    }
    fetch(`/api/teams?department_id=${departmentId}`)
      .then((r) => r.json())
      .then((json) => setTeams(json.data ?? []))
      .catch(() => {})
  }, [departmentId, showTeamField])

  // คำนวณ filtered departments จาก role ที่เลือก
  const filteredDepartments = useMemo(() => {
    if (!role || role === 'admin') return departments
    const allowed = ROLE_DEPARTMENT_FILTER[role] ?? []
    if (allowed.length === 0) return departments
    return departments.filter((d) => allowed.includes(d.name))
  }, [role, departments])

  // auto-select ถ้ามีแค่แผนกเดียว
  useEffect(() => {
    if (filteredDepartments.length === 1) {
      setDepartmentId(filteredDepartments[0].id)
    }
  }, [filteredDepartments])

  // เมื่อเปลี่ยน role → reset department ถ้าแผนกเดิมไม่อยู่ใน filter ใหม่
  const handleRoleChange = (newRole: string) => {
    const allowed = ROLE_DEPARTMENT_FILTER[newRole] ?? []
    const currentDeptName = departments.find((d) => d.id === departmentId)?.name
    const stillValid =
      allowed.length === 0 || (currentDeptName != null && allowed.includes(currentDeptName))
    setRole(newRole)
    if (!stillValid) {
      setDepartmentId('none')
      setTeamId('none')
    }
  }

  // เมื่อเปลี่ยน department → reset team
  const handleDepartmentChange = (value: string | null) => {
    setDepartmentId(value ?? 'none')
    setTeamId('none')
  }

  // Fill form when editing
  useEffect(() => {
    if (open) {
      if (user) {
        setFullName(user.full_name ?? '')
        setEmail(user.email ?? '')
        setRole(user.role ?? 'sales')
        setDepartmentId(user.department_id ?? 'none')
        setTeamId(user.team_id ?? 'none')
        setPhone(user.phone ?? '')
        setIsActive(user.is_active ?? true)
      } else {
        setFullName('')
        setEmail('')
        setRole('sales')
        setDepartmentId('none')
        setTeamId('none')
        setPhone('')
        setIsActive(true)
      }
      setPassword('')
      setShowPassword(false)
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
        team_id: showTeamField ? (teamId === 'none' ? null : teamId || null) : null,
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
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#F5EDE6' }}
            >
              <User className="h-5 w-5" style={{ color: '#7B4F2E' }} />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isEdit ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">

          {/* ─── กลุ่ม: ข้อมูลส่วนตัว ─── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              ข้อมูลส่วนตัว
            </p>

            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-3.5 w-3.5 text-gray-400" />
                ชื่อ-นามสกุล <span className="text-red-500">*</span>
              </Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ชื่อ นามสกุล"
                className={errors.full_name ? 'border-red-300 focus-visible:ring-red-300' : ''}
              />
              {errors.full_name && <p className="text-xs text-red-500">{errors.full_name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Phone className="h-3.5 w-3.5 text-gray-400" />
                เบอร์โทรศัพท์
              </Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0XX-XXX-XXXX"
              />
            </div>
          </div>

          {/* ─── กลุ่ม: ข้อมูลระบบ ─── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              ข้อมูลระบบ
            </p>

            {/* Email — create only */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  อีเมล <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className={errors.email ? 'border-red-300 focus-visible:ring-red-300' : ''}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Lock className="h-3.5 w-3.5 text-gray-400" />
                รหัสผ่าน{' '}
                {!isEdit ? (
                  <span className="text-red-500">*</span>
                ) : (
                  <span className="font-normal text-gray-400 text-xs">(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEdit ? 'รหัสผ่านใหม่ (ถ้าต้องการเปลี่ยน)' : 'อย่างน้อย 8 ตัวอักษร'}
                  className={`pr-10 ${errors.password ? 'border-red-300 focus-visible:ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs text-red-500">{errors.password}</p>
              ) : (
                <p className="text-xs text-gray-400">รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร</p>
              )}
            </div>

            {/* Role */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
                สิทธิ์การใช้งาน (Role) <span className="text-red-500">*</span>
              </Label>
              <Select value={role} onValueChange={(v) => handleRoleChange(v ?? 'sales')}>
                <SelectTrigger className={errors.role ? 'border-red-300 focus:ring-red-300' : ''}>
                  <SelectValue>
                    {role ? (ROLES.find((r) => r.value === role)?.label ?? role) : 'เลือก Role'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                แผนก
              </Label>
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกแผนก">
                    {departmentId === 'none' || !departmentId
                      ? 'ไม่ระบุแผนก'
                      : (departments.find((d) => d.id === departmentId)?.name ?? 'เลือกแผนก')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-400">— ไม่ระบุแผนก —</span>
                  </SelectItem>
                  {filteredDepartments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team — show for worker and team_lead only */}
            {showTeamField && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-3.5 w-3.5 text-gray-400" />
                  ทีม
                </Label>
                <Select
                  value={teamId}
                  onValueChange={(v) => setTeamId(v != null ? v : 'none')}
                  disabled={!departmentId || departmentId === 'none'}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกทีม">
                      {teamId === 'none' || !teamId
                        ? 'ไม่ระบุทีม'
                        : (teams.find((t) => t.id === teamId)?.name ?? 'เลือกทีม')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="text-gray-400">— ไม่ระบุทีม —</span>
                    </SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(!departmentId || departmentId === 'none') && (
                  <p className="text-xs text-gray-400">เลือกแผนกก่อนเพื่อดูทีม</p>
                )}
              </div>
            )}

            {/* Active toggle — edit only */}
            {isEdit && (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <Label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                    สถานะบัญชี:{' '}
                    <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </Label>
                </div>
                <Switch
                  id="is_active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#7B4F2E' }}
              className="text-white flex-1 sm:flex-none hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  กำลังบันทึก...
                </span>
              ) : isEdit ? (
                'บันทึกการเปลี่ยนแปลง'
              ) : (
                'สร้างผู้ใช้'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
