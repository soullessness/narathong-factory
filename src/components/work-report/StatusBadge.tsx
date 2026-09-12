'use client'

import { cn } from '@/lib/utils'
import type { WorkReportStatus } from '@/types/work-report'
import { Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'

interface StatusBadgeProps {
  status: WorkReportStatus
  className?: string
}

const STATUS_CONFIG: Record<
  WorkReportStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  draft: {
    label: 'ฉบับร่าง',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
    icon: <FileText className="w-3 h-3" />,
  },
  submitted: {
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

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        cfg.className,
        className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  )
}
