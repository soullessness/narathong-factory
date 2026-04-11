export type ProductType = 'door' | 'frame' | 'window' | 'floor' | 'ceiling' | 'wall' | 'fence' | 'deck' | 'other'
export type PriceRequestStatus = 'pending' | 'reviewing' | 'quoted' | 'rejected'

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  door: 'ประตู',
  frame: 'วงกบ',
  window: 'หน้าต่าง',
  floor: 'ไม้พื้น',
  ceiling: 'ไม้ฝ้า',
  wall: 'ไม้ผนัง',
  fence: 'ระแนง',
  deck: 'เดคไม้',
  other: 'อื่นๆ',
}

export const STATUS_LABELS: Record<PriceRequestStatus, string> = {
  pending: 'รอดำเนินการ',
  reviewing: 'กำลังพิจารณา',
  quoted: 'แจ้งราคาแล้ว',
  rejected: 'ปฏิเสธ',
}

export interface PriceRequest {
  id: string
  quotation_id?: string
  project_id?: string
  requested_by: string
  product_type: ProductType
  product_name: string
  spec?: string
  quantity: number
  unit: string
  deadline_date?: string
  status: PriceRequestStatus
  created_at: string
  updated_at: string
  // joined
  requester?: { full_name: string }
  project?: { name: string }
  quotation?: { quotation_number: string }
  response?: PriceRequestResponse
}

export interface PriceRequestResponse {
  id: string
  request_id: string
  responded_by: string
  unit_price: number
  total_price: number
  production_days?: number
  notes?: string
  responded_at: string
  responder?: { full_name: string }
}
