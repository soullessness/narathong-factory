export type CRMStage =
  | 'lead'
  | 'presentation'
  | 'quotation'
  | 'deposit'
  | 'production'
  | 'delivery'
  | 'installation'
  | 'completed'
  | 'cancelled'

export type CustomerType = 'retail' | 'contractor' | 'developer'

export interface Customer {
  id: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  customer_type: CustomerType
  notes?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  full_name: string
  role: string
  department_id?: string | null
  phone?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CRMProject {
  id: string
  project_code?: string | null
  name: string
  customer_id?: string | null
  stage: CRMStage
  status: string
  value?: number | null
  deposit_amount?: number | null
  deadline?: string | null
  notes?: string | null
  assigned_sales?: string | null
  created_by?: string | null
  created_at: string
  updated_at: string
  // Joins
  customers?: Customer | null
  profiles?: Profile | null
}

export interface CRMStageLog {
  id: string
  project_id: string
  from_stage?: string | null
  to_stage: string
  note?: string | null
  changed_by?: string | null
  changed_at: string
  // Join
  profiles?: Profile | null
}

export interface CreateProjectInput {
  name: string
  customer_id?: string
  stage: CRMStage
  value?: number
  deposit_amount?: number
  deadline?: string
  assigned_sales?: string
  notes?: string
}

export interface UpdateProjectInput {
  name?: string
  customer_id?: string
  stage?: CRMStage
  value?: number
  deposit_amount?: number
  deadline?: string
  assigned_sales?: string
  notes?: string
  status?: string
}

export interface CreateCustomerInput {
  name: string
  contact_name?: string
  phone?: string
  email?: string
  address?: string
  customer_type: CustomerType
}

export const STAGE_CONFIG: Record<
  CRMStage,
  { label: string; color: string; bgColor: string; borderColor: string; textColor: string }
> = {
  lead: {
    label: 'รับเรื่อง',
    color: 'gray',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-700',
  },
  presentation: {
    label: 'นำเสนอ',
    color: 'blue',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-700',
  },
  quotation: {
    label: 'ใบเสนอราคา',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    textColor: 'text-yellow-700',
  },
  deposit: {
    label: 'รับมัดจำ',
    color: 'green',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    textColor: 'text-green-700',
  },
  production: {
    label: 'ผลิต',
    color: 'orange',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    textColor: 'text-orange-700',
  },
  delivery: {
    label: 'จัดส่ง',
    color: 'purple',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-700',
  },
  installation: {
    label: 'ติดตั้ง',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    textColor: 'text-indigo-700',
  },
  completed: {
    label: 'จบโปรเจค ✅',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-400',
    textColor: 'text-emerald-800',
  },
  cancelled: {
    label: 'ยกเลิก ❌',
    color: 'red',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    textColor: 'text-red-700',
  },
}

export const STAGE_ORDER: CRMStage[] = [
  'lead',
  'presentation',
  'quotation',
  'deposit',
  'production',
  'delivery',
  'installation',
  'completed',
  'cancelled',
]

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  retail: 'ลูกค้าทั่วไป',
  contractor: 'ผู้รับเหมา',
  developer: 'นักพัฒนา/Developer',
}
