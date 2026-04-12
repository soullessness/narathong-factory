'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'
import type { Product, ProductCategory } from '@/types/product'
import { computeAreaPricing } from '@/types/product'

interface ProductPickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (product: Product) => void
}

export function ProductPickerModal({ open, onClose, onSelect }: ProductPickerModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/product-categories'),
      ])
      const [prodJson, catJson] = await Promise.all([prodRes.json(), catRes.json()])
      setProducts((prodJson.data || []).map(computeAreaPricing))
      setCategories(catJson.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchData()
      setSearch('')
      setSelectedCategory('all')
    }
  }, [open, fetchData])

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle>เลือกสินค้า</DialogTitle>
        </DialogHeader>

        {/* Search + Filter */}
        <div className="px-4 py-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9 text-sm"
              placeholder="ค้นหาสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
                selectedCategory === 'all'
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: '#2BA8D4' } : {}}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
                  selectedCategory === c.id
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
                style={selectedCategory === c.id ? { backgroundColor: '#2BA8D4' } : {}}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">ไม่พบสินค้า</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((product) => (
                <button
                  key={product.id}
                  onClick={() => { onSelect(product); onClose() }}
                  className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-sky-400 hover:bg-sky-50 transition-colors text-left"
                >
                  {/* Image */}
                  <div className="w-14 h-14 flex-shrink-0">
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt="" className="w-14 h-14 object-cover rounded-md border" />
                    ) : (
                      <div className="w-14 h-14 bg-sky-100 rounded-md flex items-center justify-center text-xl">🪵</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-800">{product.name}</p>
                      {product.sku && (
                        <span className="text-xs text-gray-400">{product.sku}</span>
                      )}
                      {product.category && (
                        <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 border-0">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: '#2BA8D4' }}>
                        {product.price_per_unit.toLocaleString('th-TH')} บาท/{product.unit}
                      </p>
                      {product.price_per_sqm && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          {product.price_per_sqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/ตร.ม.
                        </Badge>
                      )}
                      {product.price_per_pack && product.pieces_per_pack && (
                        <span className="text-xs text-gray-500">
                          แพ็ค {product.pieces_per_pack} แผ่น = {product.price_per_pack.toLocaleString('th-TH')} บาท
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
