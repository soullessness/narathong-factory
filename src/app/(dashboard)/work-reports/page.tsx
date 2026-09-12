'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { FileText, Plus, Clock, CheckCircle2, AlertCircle, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WorkReportCard } from '@/components/work-report/WorkReportCard'
import { useUserRole } from '@/hooks/useUserRole'
import type { WorkReport, Team } from '@/types/work-report'

type StatusFilter = '' | 'draft' | 'submitted' | 'approved' | 'rejected'

export default function WorkReportsPage() {
  const today = new Date().toISOString().split('T')[0]
  const { role, userId, loading: userLoading } = useUserRole()
  const userRole = role ?? 'worker'

  const [reports, setReports] = useState<WorkReport[]>([])
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])

  const [filterDate, setFilterDate] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('')

  const [deletingReport, setDeletingReport] = useState<WorkReport | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isManager = ['admin', 'factory_manager', 'executive', 'team_lead'].includes(userRole)
  const canApprove = ['admin', 'factory_manager', 'team_lead'].includes(userRole)

  // Load teams for filter (managers only)
  useEffect(() => {
    if (!isManager) return
    fetch('/api/teams')
      .then((r) => r.json())
      .then((json) => setTeams(json.data ?? []))
      .catch(() => {})
  }, [isManager])

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDate) params.set('date', filterDate)
      if (filterTeam) params.set('team_id', filterTeam)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/work-reports?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      setReports(json.data ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterTeam, filterStatus])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleDelete = async (report: WorkReport) => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/work-reports/${report.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'ลบไม่สำเร็จ')
      toast.success('ลบรายงานเรียบร้อย')
      setReports((prev) => prev.filter((r) => r.id !== report.id))
      setDeletingReport(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Stats
  const submittedCount = reports.filter((r) => r.status === 'submitted').length
  const approvedCount = reports.filter((r) => r.status === 'approved').length
  const draftCount = reports.filter((r) => r.status === 'draft').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: '#2BA8D4' }} />
            รายงานผลงาน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isManager
              ? 'ติดตามและอนุมัติรายงานผลงานของทีม'
              : 'สร้างและส่งรายงานผลงานของคุณ'}
          </p>
        </div>
        <Link href="/work-reports/new">
          <Button
            className="text-white flex items-center gap-1.5 flex-shrink-0"
            style={{ backgroundColor: '#2BA8D4' }}
          >
            <Plus className="w-4 h-4" />
            สร้างรายงาน
          </Button>
        </Link>
      </div>

      {/* Stats */}
      {canApprove && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sky-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">รออนุมัติ</span>
            </div>
            <p className="text-2xl font-bold text-sky-700">{submittedCount}</p>
            <p className="text-xs text-gray-500">รายงาน</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">อนุมัติแล้ว</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-gray-500">รายงาน</p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">ฉบับร่าง</span>
            </div>
            <p className="text-2xl font-bold text-gray-700">{draftCount}</p>
            <p className="text-xs text-gray-500">รายงาน</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Filter className="w-3.5 h-3.5" />
          <span>กรอง:</span>
        </div>
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto text-sm"
          max={today}
        />
        {isManager && teams.length > 0 && (
          <Select value={filterTeam || '__all__'} onValueChange={(v) => setFilterTeam(v === '__all__' ? '' : (v ?? ''))}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue placeholder="ทุกทีม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">ทุกทีม</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select
          value={filterStatus || '__all__'}
          onValueChange={(v) => setFilterStatus(v === '__all__' ? '' : (v as StatusFilter))}
        >
          <SelectTrigger className="w-44 text-sm">
            <SelectValue placeholder="ทุกสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">ทุกสถานะ</SelectItem>
            <SelectItem value="draft">ฉบับร่าง</SelectItem>
            <SelectItem value="submitted">รอการอนุมัติ</SelectItem>
            <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>
        {(filterDate || filterTeam || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={() => {
              setFilterDate('')
              setFilterTeam('')
              setFilterStatus('')
            }}
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">ยังไม่มีรายงานผลงาน</p>
          <p className="text-sm mt-1">
            กด &quot;+ สร้างรายงาน&quot; เพื่อเริ่มต้น
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <WorkReportCard
              key={report.id}
              report={report}
              canEdit={!userLoading && report.created_by === userId && report.status === 'draft'}
              canDelete={!userLoading && report.created_by === userId && report.status === 'draft'}
              onDelete={(r) => setDeletingReport(r)}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deletingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-lg">🗑️</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">ยืนยันการลบ</h3>
                <p className="text-sm text-gray-500 mt-0.5">การลบไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              คุณต้องการลบรายงานวันที่{' '}
              <strong>
                {new Date(deletingReport.report_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </strong>{' '}
              ใช่ไหม?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingReport(null)}
                disabled={deleteLoading}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleDelete(deletingReport)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'กำลังลบ...' : 'ลบรายงาน'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
