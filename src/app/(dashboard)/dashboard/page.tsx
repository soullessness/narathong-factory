import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { canAccess } from '@/lib/permissions'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderKanban,
  ClipboardList,
  Factory,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  TrendingUp,
} from 'lucide-react'
import { AdminDashboardSection } from '@/components/dashboard/AdminDashboardSection'
import type { AdminDashboardData } from '@/types/sales'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: React.ElementType }> = {
  in_progress: { label: 'กำลังดำเนินการ', variant: 'default', icon: Clock },
  planning: { label: 'วางแผน', variant: 'secondary', icon: AlertCircle },
  lead: { label: 'Lead', variant: 'secondary', icon: AlertCircle },
  proposal: { label: 'เสนอราคา', variant: 'secondary', icon: FileText },
  negotiation: { label: 'เจรจา', variant: 'secondary', icon: TrendingUp },
  completed: { label: 'เสร็จสิ้น', variant: 'outline', icon: CheckCircle2 },
  cancelled: { label: 'ยกเลิก', variant: 'outline', icon: AlertCircle },
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return '-'
  }
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // ดึง role จาก profiles table ด้วย admin client (เหมือน layout.tsx)
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role: string = profile?.role ?? 'worker'

  if (!canAccess(role, 'dashboard')) {
    redirect('/worker-logs')
  }

  const isSales = role === 'sales'
  const isAdminOrExec = ['admin', 'executive'].includes(role)

  // =========================================================
  // ดึงข้อมูลจริงจาก Supabase
  // =========================================================

  if (isSales) {
    // --- Sales View: เห็นเฉพาะโปรเจกต์ของตัวเอง ---

    const [
      { count: myProjects },
      { count: activeProjects },
      { count: completedProjects },
      { data: recentProjects },
    ] = await Promise.all([
      admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_sales', user.id),
      admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_sales', user.id)
        .not('stage', 'in', '("completed","cancelled")'),
      admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_sales', user.id)
        .eq('stage', 'completed'),
      admin
        .from('projects')
        .select('id, name, stage, created_at, customers(name)')
        .eq('assigned_sales', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const salesKpiData = [
      {
        title: 'โปรเจกต์ของฉัน',
        value: myProjects ?? 0,
        change: 0,
        changeLabel: 'ทั้งหมด',
        icon: FolderKanban,
        iconBg: 'bg-[#2BA8D4]',
      },
      {
        title: 'กำลังติดตาม',
        value: activeProjects ?? 0,
        change: 0,
        changeLabel: 'active',
        icon: Clock,
        iconBg: 'bg-orange-500',
      },
      {
        title: 'สำเร็จแล้ว',
        value: completedProjects ?? 0,
        change: 0,
        changeLabel: 'completed',
        icon: CheckCircle2,
        iconBg: 'bg-green-600',
      },
      {
        title: 'โปรเจกต์รอเสนอราคา',
        value: (recentProjects ?? []).filter((p: { stage: string }) => p.stage === 'proposal').length,
        change: 0,
        changeLabel: 'รออนุมัติ',
        icon: FileText,
        iconBg: 'bg-purple-500',
      },
    ]

    const hasProjects = (recentProjects ?? []).length > 0

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">ภาพรวมโปรเจกต์ของคุณ</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {salesKpiData.map((kpi) => (
            <KpiCard key={kpi.title} {...kpi} />
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              โปรเจกต์ล่าสุดของฉัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!hasProjects ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FolderKanban className="w-12 h-12 text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">ยังไม่มีโปรเจกต์ของคุณ</p>
                <p className="text-sm text-gray-400 mt-1">โปรเจกต์ที่ได้รับมอบหมายจะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(recentProjects ?? []).map((project: {
                  id: string
                  name: string
                  stage: string
                  created_at: string
                  customers: { name: string } | { name: string }[] | null
                }) => {
                  const status = statusConfig[project.stage] ?? statusConfig['planning']
                  const StatusIcon = status.icon
                  const customerName = Array.isArray(project.customers)
                    ? project.customers[0]?.name
                    : project.customers?.name
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-sky-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{customerName ?? '-'}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="text-xs text-gray-400 hidden sm:block">
                          {formatDate(project.created_at)}
                        </span>
                        <Badge
                          variant={status.variant}
                          className="text-xs flex items-center gap-1 whitespace-nowrap"
                        >
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Admin / Executive View: Full Dashboard ---

  if (isAdminOrExec) {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const monthStart = new Date(year, now.getMonth(), 1).toISOString()
    const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const [
      { count: totalProjects },
      { count: activeProjects },
      { count: completedProjects },
      { count: pendingWorkerLogs },
      { count: inProgressProductionOrders },
      { data: salesProfiles },
      { data: allProjects },
      { data: salesTargets },
      { data: departments },
      { data: workerLogs },
      { data: productionOrders },
    ] = await Promise.all([
      admin.from('projects').select('*', { count: 'exact', head: true }),
      admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .not('stage', 'in', '("completed","cancelled")'),
      admin
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('stage', 'completed'),
      admin
        .from('worker_logs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      admin
        .from('production_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress'),
      admin.from('profiles').select('id, full_name').eq('role', 'sales'),
      admin
        .from('projects')
        .select('id, assigned_sales, stage, total_amount, created_at'),
      admin
        .from('sales_targets')
        .select('*')
        .eq('year', year)
        .eq('month', month),
      admin.from('departments').select('id, name, type'),
      admin
        .from('worker_logs')
        .select('department_id, status, hours_worked')
        .gte('log_date', monthStart.split('T')[0])
        .lte('log_date', monthEnd.split('T')[0]),
      admin
        .from('production_orders')
        .select('status, created_at')
        .gte('created_at', monthStart)
        .lte('created_at', monthEnd),
    ])

    // Build salesPerformance
    const salesPerformance = (salesProfiles ?? []).map((sp) => {
      const myProjects = (allProjects ?? []).filter((p) => p.assigned_sales === sp.id)
      const completedThisMonth = myProjects.filter((p) => {
        if (p.stage !== 'completed') return false
        const createdAt = new Date(p.created_at)
        return createdAt >= new Date(monthStart) && createdAt <= new Date(monthEnd)
      })
      const activeOnes = myProjects.filter(
        (p) => !['completed', 'cancelled'].includes(p.stage ?? '')
      )
      const totalAmount = completedThisMonth.reduce(
        (sum: number, p: { total_amount: number | null }) => sum + (p.total_amount ?? 0),
        0
      )
      const target = (salesTargets ?? []).find((t) => t.sales_id === sp.id)
      const commissionRate = target?.commission_rate ?? 0
      const commissionEarned = (totalAmount * commissionRate) / 100

      return {
        sales_id: sp.id,
        full_name: sp.full_name,
        total_projects: myProjects.length,
        active_projects: activeOnes.length,
        completed_projects: completedThisMonth.length,
        total_amount: totalAmount,
        target: target ?? undefined,
        commission_earned: commissionEarned,
      }
    })

    // Build departmentPerformance
    const departmentPerformance = (departments ?? []).map((dept) => {
      const deptLogs = (workerLogs ?? []).filter((l) => l.department_id === dept.id)
      const approved = deptLogs.filter((l) => l.status === 'approved')
      const pending = deptLogs.filter((l) => l.status === 'pending')
      const rejected = deptLogs.filter((l) => l.status === 'rejected')
      const totalHours = approved.reduce(
        (sum: number, l: { hours_worked: number | null }) => sum + (l.hours_worked ?? 0),
        0
      )
      return {
        department_id: dept.id,
        department_name: dept.name,
        approved_logs: approved.length,
        pending_logs: pending.length,
        rejected_logs: rejected.length,
        total_hours: totalHours,
      }
    })

    const prodStats = {
      pending: (productionOrders ?? []).filter((o) => o.status === 'pending').length,
      in_progress: (productionOrders ?? []).filter((o) => o.status === 'in_progress').length,
      completed: (productionOrders ?? []).filter((o) => o.status === 'completed').length,
      cancelled: (productionOrders ?? []).filter((o) => o.status === 'cancelled').length,
    }

    const adminData: AdminDashboardData = {
      kpi: {
        totalProjects: totalProjects ?? 0,
        activeProjects: activeProjects ?? 0,
        completedProjects: completedProjects ?? 0,
        pendingWorkerLogs: pendingWorkerLogs ?? 0,
        inProgressProductionOrders: inProgressProductionOrders ?? 0,
      },
      salesPerformance,
      factoryPerformance: {
        departments: departmentPerformance,
        productionOrders: prodStats,
      },
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">ภาพรวมการดำเนินงานโรงงานนราทองพลัส</p>
        </div>

        <AdminDashboardSection data={adminData} />
      </div>
    )
  }

  // --- Factory Manager View ---

  const [
    { count: totalProjects },
    { count: inProgressProjects },
    { count: pendingLogs },
    { count: productionInProgress },
    { data: recentProjects },
  ] = await Promise.all([
    admin.from('projects').select('*', { count: 'exact', head: true }),
    admin
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('stage', 'in_progress'),
    admin
      .from('worker_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin
      .from('production_orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
    admin
      .from('projects')
      .select('id, name, stage, created_at, customers(name), sales_profile:profiles!projects_assigned_sales_fkey(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const adminKpiData = [
    {
      title: 'โปรเจกต์ทั้งหมด',
      value: totalProjects ?? 0,
      change: 0,
      changeLabel: 'ทั้งหมด',
      icon: FolderKanban,
      iconBg: 'bg-[#2BA8D4]',
    },
    {
      title: 'กำลังดำเนินการ',
      value: inProgressProjects ?? 0,
      change: 0,
      changeLabel: 'in_progress',
      icon: Clock,
      iconBg: 'bg-orange-500',
    },
    {
      title: 'งานรออนุมัติ',
      value: pendingLogs ?? 0,
      change: 0,
      changeLabel: 'worker logs pending',
      icon: ClipboardList,
      iconBg: 'bg-yellow-500',
    },
    {
      title: 'การผลิตที่ดำเนินอยู่',
      value: productionInProgress ?? 0,
      change: 0,
      changeLabel: 'production in_progress',
      icon: Factory,
      iconBg: 'bg-green-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">ภาพรวมการดำเนินงานโรงงานนราทองพลัส</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {adminKpiData.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            โปรเจกต์ล่าสุด
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!(recentProjects ?? []).length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">ยังไม่มีโปรเจกต์</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(recentProjects ?? []).map((project: {
                id: string
                name: string
                stage: string
                created_at: string
                customers: { name: string } | { name: string }[] | null
                sales_profile: { full_name: string } | { full_name: string }[] | null
              }) => {
                const status = statusConfig[project.stage] ?? statusConfig['planning']
                const StatusIcon = status.icon
                const customerName = Array.isArray(project.customers)
                  ? project.customers[0]?.name
                  : project.customers?.name
                const salesName = Array.isArray(project.sales_profile)
                  ? project.sales_profile[0]?.full_name
                  : project.sales_profile?.full_name
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-sky-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {customerName ?? '-'}
                        {salesName ? ` · ${salesName}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {formatDate(project.created_at)}
                      </span>
                      <Badge
                        variant={status.variant}
                        className="text-xs flex items-center gap-1 whitespace-nowrap"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
