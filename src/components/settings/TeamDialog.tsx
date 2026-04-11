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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Users, Building2, UserCheck } from 'lucide-react'
import type { Team } from '@/types/team'

interface Department {
  id: string
  name: string
  type?: string
}

interface Profile {
  id: string
  full_name: string
  department_id?: string
}

interface TeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  team?: Team | null
  onSuccess: () => void
}

export function TeamDialog({ open, onOpenChange, team, onSuccess }: TeamDialogProps) {
  const isEdit = !!team?.id
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState('')
  const [departmentId, setDepartmentId] = useState<string>('none')
  const [leadId, setLeadId] = useState<string>('none')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [departments, setDepartments] = useState<Department[]>([])
  const [teamLeads, setTeamLeads] = useState<Profile[]>([])

  // Load departments (production type only)
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((json) => {
        const all: Department[] = json.data ?? []
        // Filter production-type departments only
        const production = all.filter((d) => d.type === 'production')
        setDepartments(production.length > 0 ? production : all)
      })
      .catch(() => {})
  }, [])

  // Load team leads filtered by department
  useEffect(() => {
    if (!departmentId || departmentId === 'none') {
      setTeamLeads([])
      return
    }
    fetch(`/api/profiles?role=team_lead&department_id=${departmentId}`)
      .then((r) => r.json())
      .then((json) => setTeamLeads(json.data ?? []))
      .catch(() => {
        // Fallback: load all team leads without department filter
        fetch('/api/profiles?role=team_lead')
          .then((r) => r.json())
          .then((json) => {
            const all: Profile[] = json.data ?? []
            setTeamLeads(all.filter((p) => p.department_id === departmentId))
          })
          .catch(() => {})
      })
  }, [departmentId])

  // Reset lead if department changes
  const handleDepartmentChange = (value: string | null) => {
    setDepartmentId(value ?? 'none')
    setLeadId('none')
  }

  // Fill form when editing
  useEffect(() => {
    if (open) {
      if (team) {
        setName(team.name ?? '')
        setDepartmentId(team.department_id ?? 'none')
        setLeadId(team.lead_id ?? 'none')
        setDescription(team.description ?? '')
        setIsActive(team.is_active ?? true)
      } else {
        setName('')
        setDepartmentId('none')
        setLeadId('none')
        setDescription('')
        setIsActive(true)
      }
      setErrors({})
    }
  }, [open, team])

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'กรุณากรอกชื่อทีม'
    if (!departmentId || departmentId === 'none') errs.department_id = 'กรุณาเลือกแผนก'
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
        name: name.trim(),
        department_id: departmentId,
        lead_id: leadId === 'none' ? null : leadId || null,
        description: description.trim() || null,
        is_active: isActive,
      }

      const url = isEdit ? `/api/teams/${team!.id}` : '/api/teams'
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
      toast.success(isEdit ? 'อัปเดตทีมสำเร็จ' : 'สร้างทีมใหม่สำเร็จ')
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
              <Users className="h-5 w-5" style={{ color: '#7B4F2E' }} />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {isEdit ? 'แก้ไขทีม' : 'สร้างทีมใหม่'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-1">
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              ข้อมูลทีม
            </p>

            {/* ชื่อทีม */}
            <div className="space-y-1.5">
              <Label htmlFor="team_name" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Users className="h-3.5 w-3.5 text-gray-400" />
                ชื่อทีม <span className="text-red-500">*</span>
              </Label>
              <Input
                id="team_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น ทีมประกอบ A"
                className={errors.name ? 'border-red-300 focus-visible:ring-red-300' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* แผนก */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                แผนก <span className="text-red-500">*</span>
              </Label>
              <Select value={departmentId} onValueChange={handleDepartmentChange}>
                <SelectTrigger className={errors.department_id ? 'border-red-300' : ''}>
                  <SelectValue placeholder="เลือกแผนก">
                    {departmentId === 'none' || !departmentId
                      ? 'เลือกแผนก'
                      : (departments.find((d) => d.id === departmentId)?.name ?? 'เลือกแผนก')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-400">— เลือกแผนก —</span>
                  </SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department_id && (
                <p className="text-xs text-red-500">{errors.department_id}</p>
              )}
            </div>

            {/* หัวหน้าทีม */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                หัวหน้าทีม
              </Label>
              <Select
                value={leadId}
                onValueChange={(v) => setLeadId(v != null ? v : 'none')}
                disabled={!departmentId || departmentId === 'none'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหัวหน้าทีม">
                    {leadId === 'none' || !leadId
                      ? 'ไม่ระบุ'
                      : (teamLeads.find((p) => p.id === leadId)?.full_name ?? 'ไม่ระบุ')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-gray-400">— ไม่ระบุ —</span>
                  </SelectItem>
                  {teamLeads.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!departmentId || departmentId === 'none') && (
                <p className="text-xs text-gray-400">เลือกแผนกก่อนเพื่อดูหัวหน้าทีม</p>
              )}
            </div>

            {/* คำอธิบาย */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                คำอธิบาย
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับทีม..."
                rows={2}
              />
            </div>

            {/* สถานะ */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <Label htmlFor="team_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                  สถานะ:{' '}
                  <span className={isActive ? 'text-green-600' : 'text-gray-400'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </Label>
              </div>
              <Switch
                id="team_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
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
                'สร้างทีม'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
