export interface QuotationItem {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  unit_price: number
  total: number
  image_url?: string | null
  // Area pricing (จากสินค้า catalog)
  price_per_sqm?: number | null
  price_per_pack?: number | null
  pieces_per_pack?: number | null
  // Category for area breakdown
  category_slug?: string | null  // 'floor' | 'wall' | 'ceiling' | etc.
  // Custom item (price request integration)
  is_custom?: boolean
  price_request_id?: string | null
  price_request_status?: import('./price-request').PriceRequestStatus | null
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'

export interface Quotation {
  id: string
  project_id: string | null
  quotation_number: string | null
  items: QuotationItem[]
  subtotal: number
  discount: number
  discount_type: 'amount' | 'percent'
  vat_enabled: boolean
  vat_amount: number
  total: number
  status: QuotationStatus
  valid_until: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Sales & agent info
  sales_name?: string | null
  sales_phone?: string | null
  agent_name?: string | null
  agent_phone?: string | null
  // Joins
  projects?: {
    id: string
    name: string
    project_code?: string | null
    customers?: {
      id: string
      name: string
      address?: string | null
      phone?: string | null
      email?: string | null
    } | null
  } | null
}

export interface CreateQuotationInput {
  project_id: string
  quotation_number: string
  items: QuotationItem[]
  subtotal: number
  discount: number
  discount_type: 'amount' | 'percent'
  vat_enabled: boolean
  vat_amount: number
  total: number
  status: QuotationStatus
  valid_until?: string
  notes?: string
}
