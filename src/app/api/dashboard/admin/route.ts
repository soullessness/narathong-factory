import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SalesPerformance, DepartmentPerformance } from '@/types/sales'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Check role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  if (!['admin', 'executive'].includes(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Current month range
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = new Date(year, now.getMonth(), 1).toISOString()
  const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  // =============================================
  // 1. KPI Overview
  // =============================================
  const [
    { count: totalProjects },
    { count: activeProjects },
    { count: completedProjects },
    { count: pendingWorkerLogs },
    { count: inProgressProductionOrders },
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
  ])

  // =============================================
  // 2. Sales Performance (current month)
  // =============================================
  const { data: salesProfiles } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'sales')

  const { data: allProjects } = await admin
    .from('projects')
    .select('id, assigned_sales, stage, total_amount, created_at')

  const { data: salesTargets } = await admin
    .from('sales_targets')
    .select('*')
    .eq('year', year)
    .eq('month', month)

  const salesPerformance: SalesPerformance[] = (salesProfiles ?? []).map((sp) => {
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
      (sum, p) => sum + (p.total_amount ?? 0),
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

  // =============================================
  // 3. Factory Performance
  // =============================================
  const { data: departments } = await admin
    .from('departments')
    .select('id, name, type')

  // Worker logs this month by department
  const { data: workerLogs } = await admin
    .from('worker_logs')
    .select('department_id, status, hours_worked')
    .gte('log_date', monthStart.split('T')[0])
    .lte('log_date', monthEnd.split('T')[0])

  const departmentPerformance: DepartmentPerformance[] = (departments ?? []).map((dept) => {
    const deptLogs = (workerLogs ?? []).filter((l) => l.department_id === dept.id)
    const approved = deptLogs.filter((l) => l.status === 'approved')
    const pending = deptLogs.filter((l) => l.status === 'pending')
    const rejected = deptLogs.filter((l) => l.status === 'rejected')
    const totalHours = approved.reduce((sum, l) => sum + (l.hours_worked ?? 0), 0)
    return {
      department_id: dept.id,
      department_name: dept.name,
      approved_logs: approved.length,
      pending_logs: pending.length,
      rejected_logs: rejected.length,
      total_hours: totalHours,
    }
  })

  // Production orders this month
  const { data: productionOrders } = await admin
    .from('production_orders')
    .select('status, created_at')
    .gte('created_at', monthStart)
    .lte('created_at', monthEnd)

  const prodStats = {
    pending: (productionOrders ?? []).filter((o) => o.status === 'pending').length,
    in_progress: (productionOrders ?? []).filter((o) => o.status === 'in_progress').length,
    completed: (productionOrders ?? []).filter((o) => o.status === 'completed').length,
    cancelled: (productionOrders ?? []).filter((o) => o.status === 'cancelled').length,
  }

  return NextResponse.json({
    data: {
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
    },
  })
}
