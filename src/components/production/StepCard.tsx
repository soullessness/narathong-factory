'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductionStep, ProductionStepLog } from '@/types/production'
import { StepLogDialog } from './StepLogDialog'
import {
  CheckCircle2,
  Clock,
  Circle,
  SkipForward,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepCardProps {
  step: ProductionStep
  orderId: string
  isLast: boolean
  userRole: string
  userTeamId?: string
  onUpdated: () => void
}

function formatDateTime(dt?: string | null) {
  if (!dt) return '-'
  return new Date(dt).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_CONFIG = {
  pending: {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-100',
    badge: 'bg-gray-100 text-gray-600',
    lineColor: 'bg-gray-200',
    label: 'รอดำเนินการ',
  },
  in_progress: {
    icon: Clock,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
    badge: 'bg-blue-100 text-blue-700',
    lineColor: 'bg-blue-300',
    label: 'กำลังดำเนินการ',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-100',
    badge: 'bg-green-100 text-green-700',
    lineColor: 'bg-green-300',
    label: 'เสร็จแล้ว',
  },
  skipped: {
    icon: SkipForward,
    color: 'text-gray-300',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-400',
    lineColor: 'bg-gray-100',
    label: 'ข้ามขั้นตอน',
  },
}

export function StepCard({ step, orderId, isLast, userRole, userTeamId, onUpdated }: StepCardProps) {
  const [showLogs, setShowLogs] = useState(false)
  const [showLogDialog, setShowLogDialog] = useState(false)
  const [updating, setUpdating] = useState(false)

  const config = STATUS_CONFIG[step.status]
  const StatusIcon = config.icon

  const isManager = ['admin', 'factory_manager'].includes(userRole)
  const isWorkerLead = ['team_lead', 'worker'].includes(userRole)
  const isMyTeam = !step.team_id || step.team_id === userTeamId

  const canAct = (isManager || (isWorkerLead && isMyTeam)) && step.status !== 'completed' && step.status !== 'skipped'

  const handleStatusChange = async (newStatus: 'in_progress' | 'completed' | 'skipped') => {
    setUpdating(true)
    try {
      await fetch(`/api/production-orders/${orderId}/steps/${step.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      onUpdated()
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex gap-3">
      {/* Timeline */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', config.bg)}>
          <StatusIcon className={cn('w-4 h-4', config.color)} />
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-1', config.lineColor)} style={{ minHeight: '24px' }} />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 pb-6', isLast ? 'pb-2' : '')}>
        <div className={cn(
          'bg-white border rounded-lg p-3 shadow-sm',
          step.status === 'in_progress' ? 'border-blue-300' : 'border-gray-100',
          step.status === 'skipped' ? 'opacity-60' : ''
        )}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-gray-400">#{step.step_number}</span>
                <h4 className={cn(
                  'font-semibold text-sm',
                  step.status === 'skipped' ? 'line-through text-gray-400' : 'text-gray-800'
                )}>
                  {step.name}
                </h4>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', config.badge)}>
                  {config.label}
                </span>
              </div>

              {step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}

              <div className="flex flex-wrap gap-3 mt-2">
                {step.department && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3 h-3" />
                    {step.department.name}
                    {step.team && ` › ${step.team.name}`}
                  </span>
                )}
                {step.estimated_days && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    ~{step.estimated_days} วัน
                  </span>
                )}
                {step.started_at && (
                  <span className="text-xs text-gray-400">
                    เริ่ม: {formatDateTime(step.started_at)}
                  </span>
                )}
                {step.completed_at && (
                  <span className="text-xs text-green-600">
                    เสร็จ: {formatDateTime(step.completed_at)}
                  </span>
                )}
              </div>

              {step.notes && (
                <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1 mt-2">
                  {step.notes}
                </p>
              )}
            </div>

            {/* Actions */}
            {canAct && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                {step.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updating}
                  >
                    เริ่มงาน
                  </Button>
                )}
                {step.status === 'in_progress' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-sky-300 text-sky-600 hover:bg-sky-50"
                      onClick={() => setShowLogDialog(true)}
                      disabled={updating}
                    >
                      บันทึกคืบหน้า
                    </Button>
                    <Button
                      size="sm"
                      className="text-xs h-7 bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleStatusChange('completed')}
                      disabled={updating}
                    >
                      เสร็จแล้ว ✓
                    </Button>
                  </>
                )}
                {isManager && step.status !== 'skipped' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-gray-400 hover:text-gray-600"
                    onClick={() => handleStatusChange('skipped')}
                    disabled={updating}
                  >
                    ข้ามขั้นตอน
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Logs toggle */}
          {step.logs && step.logs.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                onClick={() => setShowLogs(!showLogs)}
              >
                {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                บันทึก ({step.logs.length})
              </button>

              {showLogs && (
                <div className="mt-2 space-y-1.5">
                  {step.logs.map((log) => (
                    <LogRow key={log.id} log={log} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <StepLogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        orderId={orderId}
        stepId={step.id}
        onSaved={() => {
          setShowLogDialog(false)
          onUpdated()
        }}
      />
    </div>
  )
}

function LogRow({ log }: { log: ProductionStepLog }) {
  return (
    <div className="text-xs bg-gray-50 rounded px-2 py-1.5">
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">{log.worker?.full_name || 'ไม่ระบุ'}</span>
        <span className="text-gray-400">
          {new Date(log.created_at).toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {log.quantity && (
          <Badge variant="secondary" className="text-xs h-4">
            {log.quantity} {log.unit || ''}
          </Badge>
        )}
      </div>
      <p className="text-gray-600 mt-0.5">{log.message}</p>
    </div>
  )
}
