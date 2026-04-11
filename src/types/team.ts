export interface Team {
  id: string
  name: string
  department_id: string
  lead_id?: string
  description?: string
  is_active: boolean
  created_at: string
  // joined
  department?: { name: string }
  lead?: { full_name: string }
  member_count?: number
}
