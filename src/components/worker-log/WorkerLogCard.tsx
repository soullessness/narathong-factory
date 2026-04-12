'use client'

import { cn } from '@/lib/utils'
import type { WorkerLog, WorkerLogStatus } from '@/types/worker-log'
import { Clock, Package, Calendar, CheckCircle2, XCircle, User, Users, Pencil, Trash2 } from 'lucide-react'

interface WorkerLogCardProps {
  log: WorkerLog
  showWorkerName?: boolean
  onApproveReject?: (log: WorkerLog) => void
  onEdit?: (log: WorkerLog) => void
  onDelete?: (log: WorkerLog) => void
  canEdit?: boolean
  userRole?: string
}

const STATUS_CONFIG: Record<WorkerLogStatus, { label: string; className: string; icon: React.ReactNode }> = {
  pending: {
    label: 'รอการอนุมัติ',
    className: 'bg-sky-100 text-sky-700 border-sky-200',
    icon: <Clock className="w-3 h-3" />,
  },
  approved: {
    label: 'อนุมัติแล้ว',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  rejected: {
    label: 'ปฏิเสธ',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: <XCircle className="w-3 h-3" />,
  },
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WorkerLogCard({
  log,
  showWorkerName = false,
  onApproveReject,
  onEdit,
  onDelete,
  canEdit = false,
  userRole,
}: WorkerLogCardProps) {
  const statusCfg = STATUS_CONFIG[log.status]

  // แสดงปุ่ม approve เฉพาะ role ที่มีสิทธิ์เท่านั้น (ไม่แสดงให้ worker)
  const canApprove =
    ['team_lead', 'factory_manager', 'admin', 'executive'].includes(userRole ?? '') &&
    log.status === 'pending' &&
    !!onApproveReject

  // ใช้ canApprove เป็นหลักในการ clickable card และ border
  const cardIsClickable = canApprove

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm p-4 space-y-3 transition-all hover:shadow-md',
        cardIsClickable ? 'border-sky-200 hover:border-sky-400 cursor-pointer' : 'border-gray-100'
      )}
      onClick={() => {
        if (canApprove && onApproveReject) {
          onApproveReject(log)
        }
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {showWorkerName && log.worker && (
            <div className="flex items-center gap-1.5 mb-1">
              <User className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">{log.worker.full_name}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(log.log_date)}</span>
            {log.department && (
              <>
                <span className="text-gray-300">•</span>
                <span>{log.department.name}</span>
              </>
            )}
            {log.team && (
              <>
                <span className="text-gray-300">•</span>
                <Users className="w-3 h-3 text-sky-600 flex-shrink-0" />
                <span className="text-sky-700 font-medium">{log.team.name}</span>
              </>
            )}
          </div>
        </div>
        <span className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0',
          statusCfg.className
        )}>
          {statusCfg.icon}
          {statusCfg.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-700 leading-relaxed">{log.description}</p>

      {/* Quantity / Hours */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {log.quantity != null && (
          <div className="flex items-center gap-1">
            <Package className="w-3.5 h-3.5" />
            <span>
              {log.quantity} {log.unit ?? ''}
            </span>
          </div>
        )}
        {log.hours_worked != null && (
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{log.hours_worked} ชม.</span>
          </div>
        )}
        {log.project && (
          <span className="ml-auto bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full text-xs">
            {log.project.name}
          </span>
        )}
      </div>

      {/* Approved info */}
      {log.status === 'approved' && log.approver && (
        <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            อนุมัติโดย <strong>{log.approver.full_name}</strong>
            {log.approved_at && ` เมื่อ ${formatDateTime(log.approved_at)}`}
          </span>
        </div>
      )}

      {/* Rejected info */}
      {log.status === 'rejected' && log.notes && (
        <div className="flex items-start gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2.5 py-1.5">
          <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>
            <strong>เหตุผล:</strong> {log.notes}
          </span>
        </div>
      )}

      {/* Approve/Reject button hint — แสดงเฉพาะ role ที่มีสิทธิ์อนุมัติ (ไม่แสดงให้ worker) */}
      {canApprove && (
        <div className="pt-1 border-t border-gray-100">
          <button
            className="text-xs text-sky-700 hover:text-[#166780] font-medium"
            onClick={(e) => {
              e.stopPropagation()
              onApproveReject!(log)
            }}
          >
            👆 คลิกเพื่ออนุมัติ/ปฏิเสธ
          </button>
        </div>
      )}

      {/* Edit / Delete buttons */}
      {canEdit && (
        <div className="pt-1 border-t border-gray-100 flex items-center gap-2">
          {onEdit && (
            <button
              className="flex items-center gap-1 text-xs text-sky-700 hover:text-sky-900 font-medium transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(log)
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
              แก้ไข
            </button>
          )}
          {onDelete && (
            <button
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors ml-auto"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(log)
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              ลบ
            </button>
          )}
        </div>
      )}
    </div>
  )
}
