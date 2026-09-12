'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Send, Save } from 'lucide-react'
import { toast } from 'sonner'
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
import { WorkReportItemRow, type ItemRowData } from './WorkReportItemRow'
import type { WorkType, Unit, Team, WorkReport } from '@/types/work-report'
import { useUserRole } from '@/hooks/useUserRole'

interface Worker {
  id: string
  full_name: string
}

interface WorkReportFormProps {
  report?: WorkReport
  onSaved?: (report: WorkReport) => void
}

const emptyRow = (): ItemRowData => ({
  worker_id: '',
  work_type_id: '',
  quantity: '',
  unit_id: '',
  hours_worked: '',
  good_quantity: '',
  reject_quantity: '',
  note: '',
})

export function WorkReportForm({ report, onSaved }: WorkReportFormProps) {
  const router = useRouter()
  const { role, userId } = useUserRole()
  const isManager = ['admin', 'factory_manager', 'team_lead'].includes(role ?? '')

  // Form state
  const today = new Date().toISOString().split('T')[0]
  const [reportDate, setReportDate] = useState(report?.report_date ?? today)
  const [teamId, setTeamId] = useState(report?.team_id ?? '')
  const [notes, setNotes] = useState(report?.notes ?? '')
  const [rows, setRows] = useState<ItemRowData[]>([emptyRow()])

  // Reference data
  const [teams, setTeams] = useState<Team[]>([])
  const [workTypes, setWorkTypes] = useState<WorkType[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])

  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isLocked = report && report.status !== 'draft'
  const isEditMode = !!report

  // Load reference data
  useEffect(() => {
    Promise.all([
      fetch('/api/teams').then((r) => r.json()),
      fetch('/api/work-types').then((r) => r.json()),
      fetch('/api/units').then((r) => r.json()),
    ]).then(([t, wt, u]) => {
      setTeams(t.data ?? [])
      setWorkTypes(wt.data ?? [])
      setUnits(u.data ?? [])
    })
  }, [])

  // Load workers — filter by team if selected, else load all workers
  const loadWorkers = useCallback(async (tid: string) => {
    try {
      const url = tid ? `/api/profiles?team_id=${tid}` : `/api/profiles?role=worker`
      const res = await fetch(url)
      const json = await res.json()
      // fallback: if team filter returns empty, load all
      if (tid && (json.data ?? []).length === 0) {
        const allRes = await fetch('/api/profiles')
        const allJson = await allRes.json()
        setWorkers(allJson.data ?? [])
      } else {
        setWorkers(json.data ?? [])
      }
    } catch {
      setWorkers([])
    }
  }, [])

  useEffect(() => {
    loadWorkers(teamId)
  }, [teamId, loadWorkers])

  // Pre-fill rows from existing items
  useEffect(() => {
    if (report?.items && report.items.length > 0) {
      setRows(
        report.items.map((item) => ({
          worker_id: item.worker_id,
          work_type_id: item.work_type_id,
          quantity: String(item.quantity),
          unit_id: item.unit_id,
          hours_worked: item.hours_worked != null ? String(item.hours_worked) : '',
          good_quantity: item.good_quantity != null ? String(item.good_quantity) : '',
          reject_quantity: item.reject_quantity != null ? String(item.reject_quantity) : '',
          note: item.note ?? '',
        }))
      )
    }
  }, [report])

  const handleRowChange = (index: number, field: keyof ItemRowData, value: string) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRow()])
  }

  const handleRemoveRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const buildPayload = () => ({
    report_date: reportDate,
    team_id: teamId || undefined,
    notes: notes || undefined,
    items: rows
      .filter((r) => r.worker_id && r.work_type_id && r.quantity)
      .map((r, i) => ({
        worker_id: r.worker_id,
        work_type_id: r.work_type_id,
        quantity: parseFloat(r.quantity),
        unit_id: r.unit_id,
        hours_worked: r.hours_worked ? parseFloat(r.hours_worked) : null,
        good_quantity: r.good_quantity ? parseFloat(r.good_quantity) : null,
        reject_quantity: r.reject_quantity ? parseFloat(r.reject_quantity) : null,
        note: r.note || null,
        sort_order: i + 1,
      })),
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    try {
      let reportRes: Response
      let reportData: WorkReport

      if (isEditMode && report) {
        // Update report header
        const res = await fetch(`/api/work-reports/${report.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'บันทึกไม่สำเร็จ')
        reportData = json.data
      } else {
        // Create new report
        const payload = buildPayload()
        reportRes = await fetch('/api/work-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await reportRes.json()
        if (!reportRes.ok) throw new Error(json.error ?? 'สร้างรายงานไม่สำเร็จ')
        reportData = json.data

        // Save items
        const items = buildPayload().items
        for (const item of items) {
          await fetch(`/api/work-reports/${reportData.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        }
      }

      toast.success('บันทึกฉบับร่างเรียบร้อย')
      if (onSaved) onSaved(reportData)
      if (!isEditMode) router.push(`/work-reports/${reportData.id}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!isEditMode || !report) {
      // First save draft then submit
      setSubmitting(true)
      try {
        const payload = buildPayload()
        const reportRes = await fetch('/api/work-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await reportRes.json()
        if (!reportRes.ok) throw new Error(json.error ?? 'สร้างรายงานไม่สำเร็จ')
        const reportData: WorkReport = json.data

        const items = buildPayload().items
        for (const item of items) {
          await fetch(`/api/work-reports/${reportData.id}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          })
        }

        // Submit
        const submitRes = await fetch(`/api/work-reports/${reportData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'submitted' }),
        })
        const submitJson = await submitRes.json()
        if (!submitRes.ok) throw new Error(submitJson.error ?? 'ส่งรายงานไม่สำเร็จ')

        toast.success('ส่งรายงานเรียบร้อย')
        if (onSaved) onSaved(submitJson.data)
        router.push('/work-reports')
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Submit existing draft
    setSubmitting(true)
    try {
      const res = await fetch(`/api/work-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'ส่งรายงานไม่สำเร็จ')
      toast.success('ส่งรายงานเพื่ออนุมัติเรียบร้อย')
      if (onSaved) onSaved(json.data)
      router.push('/work-reports')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-fill worker from current user if not manager and workers is empty
  useEffect(() => {
    if (!isManager && userId && workers.length === 0) {
      // If not in team, still allow row with current user
    }
  }, [isManager, userId, workers])

  const effectiveWorkers =
    workers.length > 0
      ? workers
      : userId
      ? [{ id: userId, full_name: 'ตัวเอง' }]
      : []

  return (
    <div className="space-y-6">
      {/* Report header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="report_date">วันที่รายงาน</Label>
          <Input
            id="report_date"
            type="date"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
            max={today}
            disabled={isLocked || isEditMode}
            className="text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="team">ทีม <span className="text-gray-400">(ถ้ามี)</span></Label>
          <Select
            value={teamId || 'none'}
            onValueChange={(v) => setTeamId(v === 'none' ? '' : (v ?? ''))}
            disabled={!!isLocked || isEditMode}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="เลือกทีม (ไม่บังคับ)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-sm text-gray-400">— ไม่ระบุทีม —</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-sm">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">หมายเหตุ</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="หมายเหตุเพิ่มเติม..."
          rows={2}
          className="text-sm resize-none"
          disabled={!!isLocked}
        />
      </div>

      {/* Items table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">รายการผลงาน</h3>
          {!isLocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddRow}
              className="text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              เพิ่มรายการ
            </Button>
          )}
        </div>

        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="py-2 px-2 text-left text-gray-500 w-8">#</th>
                <th className="py-2 px-2 text-left text-gray-500 min-w-[120px]">พนักงาน</th>
                <th className="py-2 px-2 text-left text-gray-500 min-w-[120px]">ประเภทงาน</th>
                <th className="py-2 px-2 text-left text-gray-500 w-24">จำนวน</th>
                <th className="py-2 px-2 text-left text-gray-500 w-24">หน่วย</th>
                <th className="py-2 px-2 text-left text-gray-500 w-20">ชั่วโมง</th>
                <th className="py-2 px-2 text-left text-gray-500 w-20">ดี</th>
                <th className="py-2 px-2 text-left text-gray-500 w-20">เสีย</th>
                <th className="py-2 px-2 text-left text-gray-500">หมายเหตุ</th>
                <th className="py-2 px-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <WorkReportItemRow
                  key={i}
                  index={i}
                  data={row}
                  workers={effectiveWorkers}
                  workTypes={workTypes}
                  units={units}
                  onChange={handleRowChange}
                  onRemove={handleRemoveRow}
                  canRemove={rows.length > 1}
                  disabled={!!isLocked}
                />
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-gray-400 text-xs">
                    ยังไม่มีรายการ — กด &quot;เพิ่มรายการ&quot; เพื่อเริ่มต้น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      {!isLocked && (
        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={saving || submitting}
            className="gap-1.5"
          >
            <Save className="w-4 h-4" />
            {saving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting}
            className="gap-1.5 text-white"
            style={{ backgroundColor: '#2BA8D4' }}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'กำลังส่ง...' : 'ส่งเพื่ออนุมัติ'}
          </Button>
        </div>
      )}

      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
          🔒 รายงานนี้ถูกส่งแล้ว ไม่สามารถแก้ไขได้
        </div>
      )}
    </div>
  )
}
