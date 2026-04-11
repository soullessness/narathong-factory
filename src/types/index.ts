export type UserRole = 'admin' | 'executive' | 'factory_manager' | 'team_lead' | 'worker' | 'sales' | 'accounting'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold'
  start_date?: string
  end_date?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  status: 'active' | 'inactive' | 'prospect'
  created_at: string
  updated_at: string
}

export interface ProductionOrder {
  id: string
  order_number: string
  customer_id: string
  product_name: string
  quantity: number
  unit: string
  status: 'pending' | 'in_production' | 'completed' | 'cancelled'
  due_date?: string
  created_at: string
  updated_at: string
}

export interface KpiData {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
}
