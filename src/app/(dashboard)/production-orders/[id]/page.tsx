'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ProductionOrder, ProductionOrderStatus } from '@/types/production'
import { StepEditor } from '@/components/production/StepEditor'
import { StepCard } from '@/components/production/StepCard'
import { useUserRole } from '@/hooks/useUserRole'
import {
  ArrowLeft,
  Factory,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  ChevronRight,
  Play,
  Loader2,
  Save,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<
  ProductionOrderStatus,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  pending: { label: 'รอดำเนินการ', color: 'text-gray-600', bg: 'bg-gray-100', icon: Circle },
  in_progress: { label: 'กำลังผลิต', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  completed: { label: 'เสร็จแล้ว', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: 'ยกเลิก', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

function formatDate(d?: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function ProductionOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { role } = useUserRole()
  const [order, setOrder] = useState<ProductionOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [userTeamId, setUserTeamId] = useState<string | undefined>()

  const orderId = params.id as string
  const isManager = role && ['admin', 'executive', 'factory_manager'].includes(role)
  const isAdmin = role === 'admin'

  const fetchOrder = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/production-orders/${orderId}`)
      const json = await res.json()
      if (res.ok) {
        setOrder(json.data)
        setNotesValue(json.data.notes || '')
      }
    } finally {
      setLoading(false)
    }
  }, [orderId])

  const fetchUserTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles/me')
      if (res.ok) {
        const json = await res.json()
        setUserTeamId(json.data?.team_id)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchOrder()
    fetchUserTeam()
  }, [fetchOrder, fetchUserTeam])

  const handleStartProduction = async () => {
    if (!order) return
    setStarting(true)
    try {
      await fetch(`/api/production-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' }),
      })

      // Set first step to in_progress
      if (order.steps && order.steps.length > 0) {
        const firstStep = order.steps.find((s) => s.step_number === 1)
        if (firstStep) {
          await fetch(`/api/production-orders/${orderId}/steps/${firstStep.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'in_progress' }),
          })
        }
      }

      await fetchOrder()
    } finally {
      setStarting(false)
    }
  }

  const handleSaveNotes = async () => {
    setSavingNotes(true)
    try {
      await fetch(`/api/production-orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesValue }),
      })
      setEditingNotes(false)
      await fetchOrder()
    } finally {
      setSavingNotes(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('ต้องการลบ Production Order นี้?')) return
    await fetch(`/api/production-orders/${orderId}`, { method: 'DELETE' })
    router.push('/production-orders')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Factory className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">ไม่พบ Production Order</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push('/production-orders')}
        >
          กลับ
        </Button>
      </div>
    )
  }

  const sc = STATUS_CONFIG[order.status]
  const StatusIcon = sc.icon
  const stepsCount = order.steps?.length || 0
  const completedSteps = order.steps?.filter((s) => s.status === 'completed').length || 0
  const progress = stepsCount > 0 ? Math.round((completedSteps / stepsCount) * 100) : 0

  const canStartProduction =
    isManager &&
    order.status === 'pending' &&
    stepsCount > 0

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/production-orders')}
          className="h-8 w-8"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span
            className="hover:text-sky-600 cursor-pointer"
            onClick={() => router.push('/production-orders')}
          >
            การผลิต
          </span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-gray-800">{order.order_number}</span>
        </div>
      </div>

      {/* Order Info Card */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
                  sc.bg,
                  sc.color
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {sc.label}
              </span>
            </div>
            <p className="text-base font-medium text-gray-700 mt-1">{order.project?.name}</p>
            {order.project?.customers && (
              <p className="text-sm text-gray-500">{order.project.customers.name}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Progress */}
            {stepsCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-28 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-400 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {completedSteps}/{stepsCount}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              {canStartProduction && (
                <Button
                  onClick={handleStartProduction}
                  disabled={starting}
                  style={{ backgroundColor: '#2BA8D4' }}
                  className="text-white gap-2 h-8"
                >
                  {starting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  เริ่มผลิต
                </Button>
              )}
              {isAdmin && order.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 h-8"
                  onClick={handleDelete}
                >
                  ลบ Order
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-500 border-t border-gray-50 pt-4">
          <div>
            <span className="text-xs text-gray-400">สร้างโดย</span>
            <p className="text-gray-700">{order.creator?.full_name || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-gray-400">วันที่สร้าง</span>
            <p className="text-gray-700">{formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-4 border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400 font-medium">หมายเหตุ</span>
            {isManager && !editingNotes && (
              <button
                className="text-xs text-sky-600 hover:text-sky-800"
                onClick={() => setEditingNotes(true)}
              >
                แก้ไข
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <Textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  style={{ backgroundColor: '#2BA8D4' }}
                  className="text-white gap-1 h-7"
                >
                  {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  บันทึก
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7"
                  onClick={() => {
                    setEditingNotes(false)
                    setNotesValue(order.notes || '')
                  }}
                >
                  ยกเลิก
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {order.notes || <span className="text-gray-400 italic">ไม่มีหมายเหตุ</span>}
            </p>
          )}
        </div>
      </div>

      {/* Steps Section */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
        {order.status === 'pending' && isManager ? (
          // Workflow Builder
          <StepEditor
            orderId={orderId}
            existingSteps={order.steps || []}
            onSaved={fetchOrder}
          />
        ) : order.steps && order.steps.length > 0 ? (
          // Timeline View
          <div>
            <h3 className="text-base font-semibold text-gray-800 mb-5">ขั้นตอนการผลิต</h3>
            <div className="space-y-0">
              {order.steps.map((step, index) => (
                <StepCard
                  key={step.id}
                  step={step}
                  orderId={orderId}
                  isLast={index === (order.steps?.length || 0) - 1}
                  userRole={role || ''}
                  userTeamId={userTeamId}
                  onUpdated={fetchOrder}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-400">
            <Factory className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">ยังไม่มีขั้นตอนการผลิต</p>
            {order.status === 'pending' && !isManager && (
              <p className="text-xs mt-1">ผู้จัดการจะกำหนด Workflow ให้</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
