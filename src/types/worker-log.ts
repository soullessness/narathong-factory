export type WorkerLogStatus = 'pending' | 'approved' | 'rejected'

export const WORKER_LOG_STATUS_LABELS: Record<WorkerLogStatus, string> = {
  pending: 'รอการอนุมัติ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
}

export interface WorkerLog {
  id: string
  worker_id: string
  project_id?: string
  department_id?: string
  log_date: string
  description: string
  quantity?: number
  unit?: string
  hours_worked?: number
  status: WorkerLogStatus
  approved_by?: string
  approved_at?: string
  notes?: string
  created_at: string
  // joined
  worker?: { full_name: string }
  department?: { name: string }
  project?: { name: string }
  approver?: { full_name: string }
}
