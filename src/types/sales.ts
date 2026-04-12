export interface SalesTarget {
  id: string
  sales_id: string
  year: number
  month: number
  target_amount: number
  commission_rate: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  sales?: { full_name: string }
}

export interface SalesPerformance {
  sales_id: string
  full_name: string
  total_projects: number
  active_projects: number
  completed_projects: number
  total_amount: number // sum of total_amount from completed projects this month
  target?: SalesTarget
  commission_earned: number // total_amount * commission_rate / 100
}

export interface DepartmentPerformance {
  department_id: string
  department_name: string
  approved_logs: number
  pending_logs: number
  rejected_logs: number
  total_hours: number
}

export interface AdminDashboardData {
  kpi: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    pendingWorkerLogs: number
    inProgressProductionOrders: number
  }
  salesPerformance: SalesPerformance[]
  factoryPerformance: {
    departments: DepartmentPerformance[]
    productionOrders: {
      pending: number
      in_progress: number
      completed: number
      cancelled: number
    }
  }
}
