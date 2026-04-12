'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Pencil, Trash2, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { ProductDialog } from '@/components/product/ProductDialog'
import { CategoryDialog } from '@/components/product/CategoryDialog'
import type { Product, ProductCategory } from '@/types/product'
import { computeAreaPricing } from '@/types/product'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Dialogs
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?active=false'),
        fetch('/api/product-categories'),
      ])
      const [prodJson, catJson] = await Promise.all([prodRes.json(), catRes.json()])
      setProducts((prodJson.data || []).map(computeAreaPricing))
      setCategories(catJson.data || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const filtered = products.filter((p) => {
    const matchCat = activeCategory === 'all' || p.category_id === activeCategory
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleDelete = async (product: Product) => {
    if (!confirm(`ลบสินค้า "${product.name}" ?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      toast.success('ลบสินค้าสำเร็จ')
      fetchAll()
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ')
    }
  }

  const handleDeleteCategory = async (cat: ProductCategory) => {
    if (!confirm(`ลบหมวดหมู่ "${cat.name}" ?`)) return
    try {
      const res = await fetch(`/api/product-categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      toast.success('ลบหมวดหมู่สำเร็จ')
      if (activeCategory === cat.id) setActiveCategory('all')
      fetchAll()
    } catch {
      toast.error('เกิดข้อผิดพลาดในการลบ')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการรายการสินค้าและกลุ่มสินค้า</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setEditingCategory(null); setCategoryDialogOpen(true) }}
            className="gap-1.5"
          >
            <Settings2 className="w-4 h-4" />
            จัดการหมวดหมู่
          </Button>
          <Button
            size="sm"
            onClick={() => { setEditingProduct(null); setProductDialogOpen(true) }}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white gap-1.5"
          >
            <Plus className="w-4 h-4" />
            เพิ่มสินค้า
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 text-sm"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
            activeCategory === 'all'
              ? 'text-white border-transparent'
              : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
          }`}
          style={activeCategory === 'all' ? { backgroundColor: '#2BA8D4' } : {}}
        >
          ทั้งหมด ({products.length})
        </button>
        {categories.map((c) => {
          const count = products.filter((p) => p.category_id === c.id).length
          return (
            <div key={c.id} className="relative group">
              <button
                onClick={() => setActiveCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
                  activeCategory === c.id
                    ? 'text-white border-transparent'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-sky-300'
                }`}
                style={activeCategory === c.id ? { backgroundColor: '#2BA8D4' } : {}}
              >
                {c.name} ({count})
                {c.has_area_pricing && (
                  <span className="ml-1 text-xs opacity-70">📐</span>
                )}
              </button>
              {/* Edit/Delete category on hover */}
              <div className="absolute -top-7 left-0 hidden group-hover:flex gap-1 bg-white border border-gray-200 rounded-md shadow-sm px-1 py-0.5 z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCategory(c); setCategoryDialogOpen(true) }}
                  className="p-1 text-gray-400 hover:text-blue-500"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteCategory(c) }}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Product grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🪵</p>
          <p className="font-medium">ยังไม่มีสินค้า</p>
          <p className="text-sm mt-1">กดปุ่ม &quot;เพิ่มสินค้า&quot; เพื่อเริ่มต้น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-40 bg-sky-50">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">🪵</div>
                )}
                {/* Status badge */}
                {!product.is_active && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">ปิดใช้งาน</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-3 space-y-1.5">
                {product.category && (
                  <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 border-0">
                    {product.category.name}
                  </Badge>
                )}
                <p className="font-semibold text-sm text-gray-800 line-clamp-2">{product.name}</p>
                {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}

                {/* Pricing */}
                <div className="space-y-0.5 pt-1">
                  <p className="text-sm font-bold" style={{ color: '#2BA8D4' }}>
                    {product.price_per_unit.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท/{product.unit}
                  </p>
                  {product.price_per_sqm && (
                    <p className="text-xs text-green-700 font-medium">
                      ≈ {product.price_per_sqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/ตร.ม.
                    </p>
                  )}
                  {product.price_per_pack && product.pieces_per_pack && (
                    <p className="text-xs text-gray-500">
                      แพ็ค {product.pieces_per_pack} แผ่น = {product.price_per_pack.toLocaleString('th-TH')} บาท
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => { setEditingProduct(product); setProductDialogOpen(true) }}
                  >
                    <Pencil className="w-3 h-3" /> แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-7 text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="w-3 h-3" /> ลบ
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ProductDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        onSaved={fetchAll}
        product={editingProduct}
        categories={categories}
      />
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onSaved={fetchAll}
        categories={categories}
      />
    </div>
  )
}
