'use client'

import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, Plus, Users, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { WorkerLogCard } from '@/components/worker-log/WorkerLogCard'
import { WorkerLogDialog } from '@/components/worker-log/WorkerLogDialog'
import { ApproveRejectDialog } from '@/components/worker-log/ApproveRejectDialog'
import { createClient } from '@/lib/supabase/client'
import type { WorkerLog } from '@/types/worker-log'

interface Department {
  id: string
  name: string
}

type StatusFilter = '' | 'pending' | 'approved' | 'rejected'

function canEditLog(log: WorkerLog, userRole: string, userId: string): boolean {
  if (userRole === 'admin' || userRole === 'factory_manager') return true
  return log.worker_id === userId && log.status === 'pending'
}

export default function WorkerLogsPage() {
  const today = new Date().toISOString().split('T')[0]

  const [logs, setLogs] = useState<WorkerLog[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('worker')
  const [userId, setUserId] = useState<string>('')
  const [departments, setDepartments] = useState<Department[]>([])

  // Filters
  const [filterDate, setFilterDate] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('')
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('')

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<WorkerLog | null>(null)
  const [selectedLog, setSelectedLog] = useState<WorkerLog | null>(null)
  const [approveOpen, setApproveOpen] = useState(false)
  const [deletingLog, setDeletingLog] = useState<WorkerLog | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isManager = ['admin', 'factory_manager', 'executive'].includes(userRole)
  const isApprover = ['admin', 'factory_manager', 'team_lead'].includes(userRole)

  // Load user role
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserRole(user.user_metadata?.role ?? 'worker')
        setUserId(user.id)
      }
    })
  }, [])

  // Load departments (manager only)
  useEffect(() => {
    if (!isManager) return
    fetch('/api/departments')
      .then((r) => r.json())
      .then((json) => setDepartments(json.data ?? []))
      .catch(() => {})
  }, [isManager])

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDate) params.set('date', filterDate)
      if (filterDepartment) params.set('department_id', filterDepartment)
      if (filterStatus) params.set('status', filterStatus)

      const res = await fetch(`/api/worker-logs?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      setLogs(json.data ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterDepartment, filterStatus])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleLogCreated = (log: WorkerLog) => {
    setLogs((prev) => [log, ...prev])
  }

  const handleLogUpdated = (updated: WorkerLog) => {
    setLogs((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
  }

  const handleDelete = async (log: WorkerLog) => {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/worker-logs/${log.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'ลบไม่สำเร็จ')
      toast.success('ลบบันทึกงานเรียบร้อย')
      setLogs((prev) => prev.filter((l) => l.id !== log.id))
      setDeletingLog(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Summary stats
  const pendingCount = logs.filter((l) => l.status === 'pending').length
  const approvedCount = logs.filter((l) => l.status === 'approved').length
  const todayLogs = logs.filter((l) => l.log_date === today)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: '#2BA8D4' }} />
            บันทึกงานประจำวัน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isManager
              ? 'ภาพรวมการทำงานของพนักงานในโรงงาน'
              : 'บันทึกและติดตามงานของคุณ'}
          </p>
        </div>
        {/* Worker: create button */}
        {!isManager && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="text-white flex items-center gap-1.5 flex-shrink-0"
            style={{ backgroundColor: '#2BA8D4' }}
          >
            <Plus className="w-4 h-4" />
            บันทึกงานวันนี้
          </Button>
        )}
      </div>

      {/* Summary Stats (manager only) */}
      {isApprover && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-sky-700 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">รออนุมัติ</span>
            </div>
            <p className="text-2xl font-bold text-sky-700">{pendingCount}</p>
            <p className="text-xs text-gray-500">รายการ</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-medium">อนุมัติแล้ว</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{approvedCount}</p>
            <p className="text-xs text-gray-500">รายการ</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">วันนี้</span>
            </div>
            <p className="text-2xl font-bold text-blue-700">{todayLogs.length}</p>
            <p className="text-xs text-gray-500">รายการบันทึก</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-auto text-sm"
          placeholder="กรองวันที่"
          max={today}
        />

        {isManager && departments.length > 0 && (
          <Select value={filterDepartment} onValueChange={(v) => setFilterDepartment(v ?? '')}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue placeholder="ทุกแผนก" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">ทุกแผนก</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus((v ?? '') as StatusFilter)}
        >
          <SelectTrigger className="w-40 text-sm">
            <SelectValue placeholder="ทุกสถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">ทุกสถานะ</SelectItem>
            <SelectItem value="pending">รอการอนุมัติ</SelectItem>
            <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
            <SelectItem value="rejected">ปฏิเสธ</SelectItem>
          </SelectContent>
        </Select>

        {(filterDate || filterDepartment || filterStatus) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={() => {
              setFilterDate('')
              setFilterDepartment('')
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
      ) : logs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">ยังไม่มีบันทึกงาน</p>
          {!isManager && (
            <p className="text-sm mt-1">
              กด &quot;+ บันทึกงานวันนี้&quot; เพื่อเริ่มบันทึกงาน
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log) => (
            <WorkerLogCard
              key={log.id}
              log={log}
              showWorkerName={isApprover}
              isApprover={isApprover}
              onApproveReject={(l) => {
                setSelectedLog(l)
                setApproveOpen(true)
              }}
              canEdit={canEditLog(log, userRole, userId)}
              onEdit={(l) => setEditingLog(l)}
              onDelete={(l) => setDeletingLog(l)}
            />
          ))}
        </div>
      )}

      {/* Worker: create dialog */}
      <WorkerLogDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={handleLogCreated}
      />

      {/* Edit dialog */}
      <WorkerLogDialog
        open={!!editingLog}
        log={editingLog}
        onClose={() => setEditingLog(null)}
        onSaved={(updated) => {
          handleLogUpdated(updated)
          setEditingLog(null)
        }}
      />

      {/* Approver: approve/reject dialog */}
      <ApproveRejectDialog
        open={approveOpen}
        log={selectedLog}
        onClose={() => {
          setApproveOpen(false)
          setSelectedLog(null)
        }}
        onDone={handleLogUpdated}
      />

      {/* Delete confirmation dialog */}
      {deletingLog && (
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
              คุณต้องการลบบันทึกงานวันที่{' '}
              <strong>{new Date(deletingLog.log_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}</strong>{' '}
              ใช่ไหม?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingLog(null)}
                disabled={deleteLoading}
              >
                ยกเลิก
              </Button>
              <Button
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={() => handleDelete(deletingLog)}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'กำลังลบ...' : 'ลบบันทึก'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
