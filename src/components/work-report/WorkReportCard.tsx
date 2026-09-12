'use client'

import Link from 'next/link'
import { Calendar, Users, FileText, Pencil, Trash2 } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import type { WorkReport } from '@/types/work-report'

interface WorkReportCardProps {
  report: WorkReport
  onDelete?: (report: WorkReport) => void
  canDelete?: boolean
  canEdit?: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function WorkReportCard({ report, onDelete, canDelete, canEdit }: WorkReportCardProps) {
  const isDraft = report.status === 'draft'

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{formatDate(report.report_date)}</span>
          </div>
          {report.team && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <Users className="w-3.5 h-3.5 text-sky-500 flex-shrink-0" />
              <span className="truncate">{report.team.name}</span>
            </div>
          )}
          {report.department && (
            <p className="text-xs text-gray-400 mt-0.5">{report.department.name}</p>
          )}
        </div>
        <StatusBadge status={report.status} />
      </div>

      {/* Creator */}
      {report.creator && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <FileText className="w-3.5 h-3.5" />
          <span>สร้างโดย <strong className="text-gray-700">{report.creator.full_name}</strong></span>
        </div>
      )}

      {/* Notes */}
      {report.notes && (
        <p className="text-xs text-gray-500 line-clamp-2 bg-gray-50 rounded-lg px-2.5 py-1.5">
          {report.notes}
        </p>
      )}

      {/* Approver */}
      {report.status === 'approved' && report.approver && report.approved_at && (
        <div className="text-xs text-green-600 bg-green-50 rounded-lg px-2.5 py-1.5">
          อนุมัติโดย <strong>{report.approver.full_name}</strong>{' '}
          เมื่อ {formatDate(report.approved_at)}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <Link
          href={`/work-reports/${report.id}`}
          className="flex-1 text-center text-xs font-medium text-sky-700 hover:text-sky-900 py-1 rounded-lg hover:bg-sky-50 transition-colors"
        >
          ดูรายละเอียด →
        </Link>
        {canEdit && isDraft && (
          <Link
            href={`/work-reports/${report.id}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-sky-700 transition-colors px-2 py-1"
          >
            <Pencil className="w-3.5 h-3.5" />
            แก้ไข
          </Link>
        )}
        {canDelete && isDraft && onDelete && (
          <button
            onClick={() => onDelete(report)}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ลบ
          </button>
        )}
      </div>
    </div>
  )
}
