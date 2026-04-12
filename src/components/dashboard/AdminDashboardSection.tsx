'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { SalesTargetDialog } from '@/components/dashboard/SalesTargetDialog'
import {
  FolderKanban,
  Clock,
  ClipboardList,
  Factory,
  Target,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminDashboardData, SalesPerformance } from '@/types/sales'

interface AdminDashboardSectionProps {
  data: AdminDashboardData
  onRefresh?: () => void
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`
  }
  return amount.toLocaleString('th-TH')
}

function ProgressBar({ value }: { value: number }) {
  const capped = Math.min(value, 100)
  const color =
    value >= 100
      ? 'bg-green-500'
      : value >= 50
      ? 'bg-amber-400'
      : 'bg-red-500'
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all', color)}
        style={{ width: `${capped}%` }}
      />
    </div>
  )
}

function AchievementBadge({ pct }: { pct: number }) {
  if (pct >= 100)
    return (
      <Badge className="bg-green-100 text-green-700 border-0 text-xs whitespace-nowrap">
        {pct.toFixed(0)}% ✓
      </Badge>
    )
  if (pct >= 50)
    return (
      <Badge className="bg-amber-100 text-amber-700 border-0 text-xs whitespace-nowrap">
        {pct.toFixed(0)}%
      </Badge>
    )
  return (
    <Badge className="bg-red-100 text-red-600 border-0 text-xs whitespace-nowrap">
      {pct.toFixed(0)}%
    </Badge>
  )
}

export function AdminDashboardSection({ data, onRefresh }: AdminDashboardSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSales, setSelectedSales] = useState<SalesPerformance | null>(null)

  const { kpi, salesPerformance, factoryPerformance } = data

  const kpiCards = [
    {
      title: 'โปรเจกต์ทั้งหมด',
      value: kpi.totalProjects,
      icon: FolderKanban,
      iconBg: 'bg-[#2BA8D4]',
      changeLabel: 'ทั้งหมด',
    },
    {
      title: 'กำลังดำเนินการ',
      value: kpi.activeProjects,
      icon: Clock,
      iconBg: 'bg-orange-500',
      changeLabel: 'active',
    },
    {
      title: 'งานรออนุมัติ',
      value: kpi.pendingWorkerLogs,
      icon: ClipboardList,
      iconBg: 'bg-yellow-500',
      changeLabel: 'worker logs',
    },
    {
      title: 'การผลิตที่ดำเนินอยู่',
      value: kpi.inProgressProductionOrders,
      icon: Factory,
      iconBg: 'bg-green-600',
      changeLabel: 'in progress',
    },
  ]

  function openTargetDialog(sp: SalesPerformance) {
    setSelectedSales(sp)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Section A: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Section B: Sales Performance Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-4 h-4 text-[#2BA8D4]" />
              ประสิทธิภาพทีมขาย — เดือนนี้
            </CardTitle>
            <Badge variant="secondary" className="text-xs">
              {salesPerformance.length} คน
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {salesPerformance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">ไม่มีข้อมูลพนักงานขาย</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        พนักงานขาย
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        โปรเจกต์
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        ติดตาม
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        สำเร็จ
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        ยอดขายเดือนนี้
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        เป้าเดือนนี้
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide min-w-[120px]">
                        % บรรลุ
                      </th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        คอมมิชชั่น
                      </th>
                      <th className="text-center px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesPerformance.map((sp, idx) => {
                      const targetAmt = sp.target?.target_amount ?? 0
                      const pct = targetAmt > 0 ? (sp.total_amount / targetAmt) * 100 : 0
                      return (
                        <tr
                          key={sp.sales_id}
                          className={cn(
                            'border-b border-gray-50 hover:bg-sky-50/40 transition-colors',
                            idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'
                          )}
                        >
                          <td className="px-4 py-3">
                            <span className="font-medium text-gray-800">{sp.full_name}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-gray-600">{sp.total_projects}</td>
                          <td className="px-3 py-3 text-center text-orange-600 font-medium">{sp.active_projects}</td>
                          <td className="px-3 py-3 text-center text-green-600 font-medium">{sp.completed_projects}</td>
                          <td className="px-3 py-3 text-right font-semibold text-gray-800">
                            ฿{formatCurrency(sp.total_amount)}
                          </td>
                          <td className="px-3 py-3 text-right text-gray-500">
                            {targetAmt > 0 ? `฿${formatCurrency(targetAmt)}` : (
                              <span className="text-gray-300 text-xs">ไม่มีเป้า</span>
                            )}
                          </td>
                          <td className="px-3 py-3 min-w-[120px]">
                            {targetAmt > 0 ? (
                              <div className="space-y-1">
                                <div className="flex justify-center">
                                  <AchievementBadge pct={pct} />
                                </div>
                                <ProgressBar value={pct} />
                              </div>
                            ) : (
                              <span className="text-gray-300 text-xs block text-center">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-[#2BA8D4] font-medium">
                            {sp.commission_earned > 0 ? `฿${formatCurrency(sp.commission_earned)}` : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs h-7 px-2 border-[#2BA8D4]/30 text-[#2BA8D4] hover:bg-sky-50"
                              onClick={() => openTargetDialog(sp)}
                            >
                              กำหนดเป้า
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3 p-4">
                {salesPerformance.map((sp) => {
                  const targetAmt = sp.target?.target_amount ?? 0
                  const pct = targetAmt > 0 ? (sp.total_amount / targetAmt) * 100 : 0
                  return (
                    <div key={sp.sales_id} className="border border-gray-100 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-800">{sp.full_name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 px-2 border-[#2BA8D4]/30 text-[#2BA8D4]"
                          onClick={() => openTargetDialog(sp)}
                        >
                          กำหนดเป้า
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="text-gray-400 text-xs">โปรเจกต์</p>
                          <p className="font-semibold text-gray-800">{sp.total_projects}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">ติดตาม</p>
                          <p className="font-semibold text-orange-600">{sp.active_projects}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">สำเร็จ</p>
                          <p className="font-semibold text-green-600">{sp.completed_projects}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">ยอดขาย</span>
                          <span className="font-semibold">฿{formatCurrency(sp.total_amount)}</span>
                        </div>
                        {targetAmt > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">เป้า</span>
                              <span>฿{formatCurrency(targetAmt)}</span>
                            </div>
                            <ProgressBar value={pct} />
                            <div className="flex justify-between items-center">
                              <AchievementBadge pct={pct} />
                              {sp.commission_earned > 0 && (
                                <span className="text-xs text-[#2BA8D4]">
                                  คอมมิชชั่น ฿{formatCurrency(sp.commission_earned)}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section C: Factory Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Department Worker Logs */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#2BA8D4]" />
              บันทึกงาน — แผนก (เดือนนี้)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {factoryPerformance.departments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">ไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-3">
                {factoryPerformance.departments.map((dept) => {
                  const total = dept.approved_logs + dept.pending_logs + dept.rejected_logs
                  if (total === 0) return null
                  return (
                    <div key={dept.department_id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{dept.department_name}</span>
                        <span className="text-xs text-gray-400">{dept.total_hours.toFixed(1)} ชม.</span>
                      </div>
                      <div className="flex gap-1.5 text-xs">
                        {dept.approved_logs > 0 && (
                          <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            อนุมัติ {dept.approved_logs}
                          </span>
                        )}
                        {dept.pending_logs > 0 && (
                          <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            รอ {dept.pending_logs}
                          </span>
                        )}
                        {dept.rejected_logs > 0 && (
                          <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" />
                            ปฏิเสธ {dept.rejected_logs}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
                {factoryPerformance.departments.every(
                  (d) => d.approved_logs + d.pending_logs + d.rejected_logs === 0
                ) && (
                  <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีบันทึกงานเดือนนี้</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production Orders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Factory className="w-4 h-4 text-[#2BA8D4]" />
              คำสั่งผลิต (เดือนนี้)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-amber-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {factoryPerformance.productionOrders.pending}
                </p>
                <p className="text-xs text-amber-600/70 mt-1">รอดำเนินการ</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#2BA8D4]">
                  {factoryPerformance.productionOrders.in_progress}
                </p>
                <p className="text-xs text-[#2BA8D4]/70 mt-1">กำลังผลิต</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {factoryPerformance.productionOrders.completed}
                </p>
                <p className="text-xs text-green-600/70 mt-1">เสร็จสิ้น</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-400">
                  {factoryPerformance.productionOrders.cancelled}
                </p>
                <p className="text-xs text-gray-400/70 mt-1">ยกเลิก</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Target Dialog */}
      {selectedSales && (
        <SalesTargetDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          salesId={selectedSales.sales_id}
          salesName={selectedSales.full_name}
          initialData={
            selectedSales.target
              ? {
                  month: selectedSales.target.month,
                  year: selectedSales.target.year,
                  target_amount: selectedSales.target.target_amount,
                  commission_rate: selectedSales.target.commission_rate,
                }
              : undefined
          }
          onSuccess={onRefresh}
        />
      )}
    </div>
  )
}
