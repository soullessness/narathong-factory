export type ProductionOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type ProductionStepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface ProductionOrder {
  id: string
  project_id: string
  order_number: string
  status: ProductionOrderStatus
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  // joined
  project?: { name: string; customers?: { name: string } | null }
  creator?: { full_name: string }
  steps?: ProductionStep[]
  steps_count?: number
  completed_steps?: number
}

export interface ProductionStep {
  id: string
  order_id: string
  step_number: number
  name: string
  department_id?: string
  team_id?: string
  description?: string
  estimated_days?: number
  status: ProductionStepStatus
  assigned_to?: string
  started_at?: string
  completed_at?: string
  completed_by?: string
  notes?: string
  created_at: string
  // joined
  department?: { name: string }
  team?: { name: string }
  assignee?: { full_name: string }
  completer?: { full_name: string }
  logs?: ProductionStepLog[]
}

export interface ProductionStepLog {
  id: string
  step_id: string
  worker_id: string
  message: string
  quantity?: number
  unit?: string
  created_at: string
  worker?: { full_name: string }
}

export const DEFAULT_STEPS: Omit<ProductionStep, 'id' | 'order_id' | 'status' | 'created_at'>[] = [
  { step_number: 1, name: 'เตรียมไม้', description: 'คัดเลือกและเตรียมวัตถุดิบไม้' },
  { step_number: 2, name: 'ช่างไม้', description: 'ตัด ไสกบ และขึ้นรูปไม้' },
  { step_number: 3, name: 'ขัด/แต่งผิว', description: 'ขัดผิวไม้ให้เรียบ' },
  { step_number: 4, name: 'ทำสี/อบสี', description: 'พ่นสีหรืออบสีตามสเปค' },
  { step_number: 5, name: 'แพคกิ้ง', description: 'บรรจุหีบห่อพร้อมส่ง' },
  { step_number: 6, name: 'จัดส่ง', description: 'จัดส่งให้ลูกค้า' },
]
