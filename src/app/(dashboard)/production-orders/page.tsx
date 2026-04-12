'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductionOrder, ProductionOrderStatus } from '@/types/production'
import { ProductionOrderDialog } from '@/components/production/ProductionOrderDialog'
import { useUserRole } from '@/hooks/useUserRole'
import {
  Plus,
  RefreshCw,
  Factory,
  Search,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
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

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  })
}

interface WorkerStep {
  id: string
  order_id: string
  step_number: number
  name: string
  status: string
  order_number?: string
  project_name?: string
}

export default function ProductionOrdersPage() {
  const router = useRouter()
  const { role } = useUserRole()
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [workerSteps, setWorkerSteps] = useState<WorkerStep[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const isManager = role && ['admin', 'executive', 'factory_manager'].includes(role)
  const isWorker = role && ['team_lead', 'worker'].includes(role)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const url = new URL('/api/production-orders', window.location.origin)
      if (statusFilter && statusFilter !== 'all') url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString())
      const json = await res.json()
      setOrders(json.data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter((o) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      o.order_number.toLowerCase().includes(term) ||
      (o.project?.name || '').toLowerCase().includes(term) ||
      (o.project?.customers?.name || '').toLowerCase().includes(term)
    )
  })

  const stats = {
    total: orders.length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    pending: orders.filter((o) => o.status === 'pending').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การผลิต</h1>
          <p className="text-sm text-gray-500 mt-1">ติดตามและจัดการออเดอร์การผลิต</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            รีเฟรช
          </Button>
          {isManager && (
            <Button
              onClick={() => setShowDialog(true)}
              style={{ backgroundColor: '#2BA8D4' }}
              className="text-white gap-2"
            >
              <Plus className="w-4 h-4" />
              สร้าง Order
            </Button>
          )}
        </div>
      </div>

      {/* Stats - Manager view */}
      {isManager && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'ทั้งหมด', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50' },
            { label: 'กำลังผลิต', value: stats.in_progress, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'เสร็จแล้ว', value: stats.completed, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'รอดำเนินการ', value: stats.pending, color: 'text-gray-600', bg: 'bg-gray-50' },
          ].map((s) => (
            <div key={s.label} className={cn('rounded-xl p-4 border border-gray-100 shadow-sm', s.bg)}>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Worker view: My tasks */}
      {isWorker && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="text-base font-semibold text-blue-800 mb-3">งานที่รอฉัน</h2>
          {workerSteps.length === 0 ? (
            <p className="text-sm text-blue-600">ไม่มีงานที่รอดำเนินการ</p>
          ) : (
            <div className="space-y-2">
              {workerSteps.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => router.push(`/production-orders/${s.order_id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.order_number} · {s.project_name}</p>
                  </div>
                  <Badge className={cn(
                    'text-xs',
                    s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                  )}>
                    {s.status === 'in_progress' ? 'กำลังทำ' : 'รอ'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {isManager && (
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหา order, โปรเจค, ลูกค้า..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="สถานะ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสถานะ</SelectItem>
              <SelectItem value="pending">รอดำเนินการ</SelectItem>
              <SelectItem value="in_progress">กำลังผลิต</SelectItem>
              <SelectItem value="completed">เสร็จแล้ว</SelectItem>
              <SelectItem value="cancelled">ยกเลิก</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Factory className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มี Production Order</p>
          <p className="text-sm text-gray-400 mt-1">
            {isManager ? 'กดปุ่ม "สร้าง Order" เพื่อเริ่มต้น' : 'ไม่มีงานที่รอดำเนินการ'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    เลขที่ Order
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">โปรเจค</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    ลูกค้า
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    สถานะ
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    ความคืบหน้า
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                    วันที่สร้าง
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => {
                  const sc = STATUS_CONFIG[order.status]
                  const StatusIcon = sc.icon
                  const progress =
                    order.steps_count && order.steps_count > 0
                      ? Math.round(((order.completed_steps || 0) / order.steps_count) * 100)
                      : 0

                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'border-b border-gray-50 hover:bg-sky-50 transition-colors cursor-pointer',
                        idx % 2 !== 0 ? 'bg-gray-50/30' : ''
                      )}
                      onClick={() => router.push(`/production-orders/${order.id}`)}
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-sm text-sky-700 whitespace-nowrap">
                        {order.order_number}
                      </td>
                      <td className="px-4 py-3 text-gray-800 max-w-xs">
                        <span className="line-clamp-1">{order.project?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {order.project?.customers?.name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
                            sc.bg,
                            sc.color
                          )}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {order.steps_count && order.steps_count > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-sky-400 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {order.completed_steps}/{order.steps_count}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">ยังไม่กำหนด</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProductionOrderDialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onSaved={fetchOrders}
      />
    </div>
  )
}
