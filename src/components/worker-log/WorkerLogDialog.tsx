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
import { createClient } from '@/lib/supabase/client'
import type { WorkerLog } from '@/types/worker-log'

interface Project {
  id: string
  name: string
}

interface WorkerLogDialogProps {
  open: boolean
  onClose: () => void
  onSaved: (log: WorkerLog) => void
  /** ถ้ามี log → edit mode */
  log?: WorkerLog | null
}

export function WorkerLogDialog({ open, onClose, onSaved, log }: WorkerLogDialogProps) {
  const today = new Date().toISOString().split('T')[0]
  const isEditMode = !!log

  const [logDate, setLogDate] = useState(today)
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [hoursWorked, setHoursWorked] = useState('')
  const [projectId, setProjectId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [userTeamId, setUserTeamId] = useState<string | null>(null)
  const [userTeamName, setUserTeamName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    if (isEditMode && log) {
      // Edit mode: prefill from existing log
      setLogDate(log.log_date ?? today)
      setDescription(log.description ?? '')
      setQuantity(log.quantity != null ? String(log.quantity) : '')
      setUnit(log.unit ?? '')
      setHoursWorked(log.hours_worked != null ? String(log.hours_worked) : '')
      setProjectId(log.project_id ?? '')
      setNotes(log.notes ?? '')
      // team from log (read-only)
      if (log.team) {
        setUserTeamId(log.team_id ?? null)
        setUserTeamName(log.team.name ?? null)
      }
    } else {
      // Create mode: reset form
      setLogDate(today)
      setDescription('')
      setQuantity('')
      setUnit('')
      setHoursWorked('')
      setProjectId('')
      setNotes('')

      // Load current user's team
      const supabase = createClient()
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return
        supabase
          .from('profiles')
          .select('team_id, teams:teams!profiles_team_id_fkey(name)')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.team_id) {
              setUserTeamId(data.team_id)
              const teamData = data.teams as unknown as { name: string } | null
              setUserTeamName(teamData?.name ?? null)
            } else {
              setUserTeamId(null)
              setUserTeamName(null)
            }
          })
      })
    }

    // Load projects
    fetch('/api/projects')
      .then((r) => r.json())
      .then((json) => setProjects(json.data ?? []))
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!description.trim()) {
      toast.error('กรุณากรอกรายละเอียดงาน')
      return
    }

    setSaving(true)
    try {
      let res: Response
      if (isEditMode && log) {
        // Edit mode: PATCH /api/worker-logs/[id]
        res = await fetch(`/api/worker-logs/${log.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'edit',
            log_date: logDate,
            description: description.trim(),
            quantity: quantity ? parseFloat(quantity) : null,
            unit: unit.trim() || null,
            hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
            project_id: projectId || null,
            notes: notes.trim() || null,
          }),
        })
      } else {
        // Create mode: POST /api/worker-logs
        res = await fetch('/api/worker-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            log_date: logDate,
            description: description.trim(),
            quantity: quantity ? parseFloat(quantity) : null,
            unit: unit.trim() || null,
            hours_worked: hoursWorked ? parseFloat(hoursWorked) : null,
            project_id: projectId || null,
            notes: notes.trim() || null,
            team_id: userTeamId || null,
          }),
        })
      }

      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'บันทึกไม่สำเร็จ')

      toast.success(isEditMode ? 'แก้ไขบันทึกงานเรียบร้อย' : 'บันทึกงานเรียบร้อย')
      onSaved(json.data)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2BA8D4' }}>
            {isEditMode ? '✏️ แก้ไขบันทึกงาน' : '📋 บันทึกงานประจำวัน'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team info (read-only auto-fill) */}
          {userTeamId && userTeamName && (
            <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-sky-700 font-medium">ทีม:</span>
              <span className="text-xs text-[#1E8AB0] font-semibold">{userTeamName}</span>
            </div>
          )}

          {/* Date */}
          <div className="space-y-1.5">
            <Label htmlFor="log_date">วันที่</Label>
            <Input
              id="log_date"
              type="date"
              value={logDate}
              onChange={(e) => setLogDate(e.target.value)}
              max={today}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              งานที่ทำ <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="อธิบายรายละเอียดงานที่ทำวันนี้..."
              rows={3}
              required
            />
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">จำนวน</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="เช่น 10"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">หน่วย</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="เช่น ชิ้น, แผ่น, เมตร"
              />
            </div>
          </div>

          {/* Hours Worked */}
          <div className="space-y-1.5">
            <Label htmlFor="hours_worked">ชั่วโมงทำงาน</Label>
            <Input
              id="hours_worked"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={hoursWorked}
              onChange={(e) => setHoursWorked(e.target.value)}
              placeholder="เช่น 8"
            />
          </div>

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-1.5">
              <Label>โปรเจกต์ที่เกี่ยวข้อง (ถ้ามี)</Label>
              <Select value={projectId} onValueChange={(v) => setProjectId(v ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกโปรเจกต์..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">ไม่ระบุ</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes">หมายเหตุ</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="text-white"
              style={{ backgroundColor: '#2BA8D4' }}
            >
              {saving ? 'กำลังบันทึก...' : isEditMode ? 'บันทึกการแก้ไข' : 'บันทึกงาน'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
