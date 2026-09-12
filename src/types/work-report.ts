export type WorkReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected'

export const WORK_REPORT_STATUS_LABELS: Record<WorkReportStatus, string> = {
  draft: 'ฉบับร่าง',
  submitted: 'รอการอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
}

export interface Unit {
  id: string
  name: string
  symbol: string
  is_active: boolean
}

export interface WorkType {
  id: string
  name: string
  code: string
  default_unit_id?: string
  is_active: boolean
  default_unit?: Unit
}

export interface WorkReportItem {
  id: string
  work_report_id: string
  worker_id: string
  work_type_id: string
  quantity: number
  unit_id: string
  hours_worked?: number
  good_quantity?: number
  reject_quantity?: number
  note?: string
  sort_order: number
  // joined
  worker?: { id: string; full_name: string }
  work_type?: WorkType
  unit?: Unit
}

export interface ReportApproval {
  id: string
  work_report_id: string
  action_by: string
  action_role: string
  action: 'approved' | 'rejected'
  reason?: string
  created_at: string
  actor?: { full_name: string }
}

export interface WorkReport {
  id: string
  report_date: string
  team_id: string
  department_id?: string
  created_by: string
  status: WorkReportStatus
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  notes?: string
  created_at: string
  updated_at?: string
  // joined
  team?: { id: string; name: string }
  department?: { id: string; name: string }
  creator?: { id: string; full_name: string }
  approver?: { id: string; full_name: string }
  items?: WorkReportItem[]
  approvals?: ReportApproval[]
}

export interface PerformanceTarget {
  id: string
  scope_type: 'team' | 'worker'
  team_id?: string
  worker_id?: string
  work_type_id: string
  target_quantity: number
  target_unit_id: string
  effective_from: string
  effective_to?: string
  work_type?: WorkType
  unit?: Unit
}

export interface Team {
  id: string
  name: string
  department_id?: string
  leader_id?: string
  is_active: boolean
  department?: { id: string; name: string }
}
