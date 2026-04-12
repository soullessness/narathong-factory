'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Settings2,
  ShieldOff,
  LayoutGrid,
  List,
  Package,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { ProductDialog } from '@/components/product/ProductDialog'
import { CategoryDialog } from '@/components/product/CategoryDialog'
import type { Product, ProductCategory } from '@/types/product'
import { computeAreaPricing } from '@/types/product'
import { useUserRole } from '@/hooks/useUserRole'
import { canAccess } from '@/lib/permissions'

type ViewMode = 'list' | 'grid'

export default function ProductsPage() {
  const router = useRouter()
  const { role, loading: roleLoading } = useUserRole()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

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

  // Stats
  const totalProducts = products.length
  const totalCategories = categories.length
  const activeProducts = products.filter((p) => p.is_active).length

  // Group filtered products by category for list view
  const groupedProducts = categories
    .map((cat) => ({
      category: cat,
      items: filtered.filter((p) => p.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0)

  const uncategorized = filtered.filter((p) => !p.category_id)

  if (!roleLoading && role !== null && !canAccess(role, 'products')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <ShieldOff className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-gray-400 mt-1">คุณไม่มีสิทธิ์ดูหน้านี้</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/worker-logs')}>
          ไปหน้าบันทึกงาน
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
          <p className="text-sm text-gray-500 mt-0.5">จัดการรายการสินค้าและกลุ่มสินค้า</p>
        </div>
        <div className="flex gap-2 flex-wrap">
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

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EBF8FD' }}>
            <Package className="w-5 h-5" style={{ color: '#2BA8D4' }} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800 leading-none">{totalProducts}</p>
            <p className="text-xs text-gray-500 mt-0.5">สินค้าทั้งหมด</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF7ED' }}>
            <Tag className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800 leading-none">{totalCategories}</p>
            <p className="text-xs text-gray-500 mt-0.5">หมวดหมู่</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3 shadow-sm">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F0FDF4' }}>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-800 leading-none">{activeProducts}</p>
            <p className="text-xs text-gray-500 mt-0.5">ใช้งานอยู่</p>
          </div>
        </div>
      </div>

      {/* Search + View Toggle */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 text-sm"
            placeholder="ค้นหาสินค้า..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* View Toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={viewMode === 'list' ? { backgroundColor: '#2BA8D4' } : {}}
            title="มุมมองรายการ"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">รายการ</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 flex items-center gap-1.5 text-sm font-medium transition-colors ${
              viewMode === 'grid'
                ? 'text-white'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
            style={viewMode === 'grid' ? { backgroundColor: '#2BA8D4' } : {}}
            title="มุมมองตาราง"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">ตาราง</span>
          </button>
        </div>
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

      {/* Content */}
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
      ) : viewMode === 'list' ? (
        /* ─── LIST VIEW ─── */
        <div className="space-y-6">
          {/* Grouped by category */}
          {groupedProducts.map(({ category, items }) => (
            <div key={category.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Category header */}
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: '#F0FAFD' }}>
                <Tag className="w-4 h-4 flex-shrink-0" style={{ color: '#2BA8D4' }} />
                <span className="font-semibold text-sm text-gray-700">{category.name}</span>
                {category.has_area_pricing && <span className="text-xs">📐</span>}
                <span className="ml-auto text-xs text-gray-400">{items.length} รายการ</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40%] pl-4">ชื่อสินค้า</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="text-center">หน่วย</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center pr-4">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((product, idx) => (
                    <TableRow
                      key={product.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-sky-50 flex-shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">🪵</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm text-gray-800">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                            )}
                            {product.price_per_sqm && (
                              <p className="text-xs text-green-700">
                                ≈ {product.price_per_sqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/ตร.ม.
                              </p>
                            )}
                            {product.price_per_pack && product.pieces_per_pack && (
                              <p className="text-xs text-gray-500">
                                แพ็ค {product.pieces_per_pack} แผ่น = {product.price_per_pack.toLocaleString('th-TH')} บาท
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-sm" style={{ color: '#2BA8D4' }}>
                          {product.price_per_unit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-gray-600">{product.unit}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.is_active ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-0 hover:bg-green-100">
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600 border-0">
                            ปิด
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center pr-4">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => { setEditingProduct(product); setProductDialogOpen(true) }}
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(product)}
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <Tag className="w-4 h-4 flex-shrink-0 text-gray-400" />
                <span className="font-semibold text-sm text-gray-500">ไม่มีหมวดหมู่</span>
                <span className="ml-auto text-xs text-gray-400">{uncategorized.length} รายการ</span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40%] pl-4">ชื่อสินค้า</TableHead>
                    <TableHead className="text-right">ราคา/หน่วย</TableHead>
                    <TableHead className="text-center">หน่วย</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-center pr-4">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uncategorized.map((product, idx) => (
                    <TableRow
                      key={product.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}
                    >
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-md overflow-hidden bg-sky-50 flex-shrink-0 flex items-center justify-center">
                            {product.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-lg">🪵</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm text-gray-800">{product.name}</p>
                            {product.sku && (
                              <p className="text-xs text-gray-400">SKU: {product.sku}</p>
                            )}
                            {product.price_per_sqm && (
                              <p className="text-xs text-green-700">
                                ≈ {product.price_per_sqm.toLocaleString('th-TH', { maximumFractionDigits: 0 })} บาท/ตร.ม.
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-sm" style={{ color: '#2BA8D4' }}>
                          {product.price_per_unit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm text-gray-600">{product.unit}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {product.is_active ? (
                          <Badge className="text-xs bg-green-100 text-green-700 border-0 hover:bg-green-100">
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600 border-0">
                            ปิด
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center pr-4">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => { setEditingProduct(product); setProductDialogOpen(true) }}
                            title="แก้ไข"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(product)}
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        /* ─── GRID VIEW ─── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Image */}
              <div className="relative h-28 bg-sky-50">
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
              <div className="p-2.5 space-y-1.5">
                {product.category && (
                  <Badge variant="secondary" className="text-xs bg-sky-100 text-sky-700 border-0">
                    {product.category.name}
                  </Badge>
                )}
                <p className="font-semibold text-xs text-gray-800 line-clamp-2 leading-snug">{product.name}</p>

                {/* Pricing */}
                <div className="pt-1 border-t border-gray-100">
                  <p className="text-sm font-bold" style={{ color: '#2BA8D4' }}>
                    {product.price_per_unit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-gray-500 ml-1">บาท/{product.unit}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8 text-xs gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-100"
                    onClick={() => { setEditingProduct(product); setProductDialogOpen(true) }}
                  >
                    <Pencil className="w-3.5 h-3.5" /> แก้ไข
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-100"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> ลบ
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
