export interface ProductCategory {
  id: string
  name: string
  slug: string
  has_area_pricing: boolean
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  category_id: string | null
  category?: ProductCategory
  name: string
  description?: string
  sku?: string
  image_url?: string
  unit: string
  price_per_unit: number
  // Area pricing fields (for floor/wall/ceiling)
  width_mm?: number | null      // ความกว้าง (มม.)
  length_m?: number | null      // ความยาว (เมตร)
  pieces_per_pack?: number | null
  price_per_pack?: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Computed (client-side)
  area_per_piece?: number       // ตร.ม./แผ่น = (width_mm/1000) * length_m
  pieces_per_sqm?: number       // แผ่น/ตร.ม. = 1 / area_per_piece
  price_per_sqm?: number        // ราคา/ตร.ม. = price_per_unit * pieces_per_sqm
}

export function computeAreaPricing(product: Product): Product {
  if (product.width_mm && product.length_m) {
    const area_per_piece = (product.width_mm / 1000) * product.length_m
    const pieces_per_sqm = 1 / area_per_piece
    const price_per_sqm = product.price_per_unit * pieces_per_sqm
    return { ...product, area_per_piece, pieces_per_sqm, price_per_sqm }
  }
  return product
}
