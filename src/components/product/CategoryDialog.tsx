'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ProductCategory } from '@/types/product'

interface CategoryDialogProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  categories: ProductCategory[]
  category?: ProductCategory | null
}

export function CategoryDialog({ open, onClose, onSaved, categories }: CategoryDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editHasArea, setEditHasArea] = useState(false)
  const [newName, setNewName] = useState('')
  const [newHasArea, setNewHasArea] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setEditingId(null)
      setNewName('')
      setNewHasArea(false)
    }
  }, [open])

  const startEdit = (cat: ProductCategory) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditHasArea(cat.has_area_pricing)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (cat: ProductCategory) => {
    if (!editName.trim()) return
    setSaving(true)
    try {
      const res = await fetch(`/api/product-categories/${cat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), has_area_pricing: editHasArea }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('แก้ไขหมวดหมู่สำเร็จ')
      setEditingId(null)
      onSaved()
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  const deleteCategory = async (cat: ProductCategory) => {
    if (!confirm(`ลบหมวดหมู่ "${cat.name}"?`)) return
    try {
      const res = await fetch(`/api/product-categories/${cat.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('ลบไม่สำเร็จ')
      toast.success('ลบหมวดหมู่สำเร็จ')
      onSaved()
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const addCategory = async () => {
    if (!newName.trim()) {
      toast.error('กรุณากรอกชื่อหมวดหมู่')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/product-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), has_area_pricing: newHasArea }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('เพิ่มหมวดหมู่สำเร็จ')
      setNewName('')
      setNewHasArea(false)
      onSaved()
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>จัดการหมวดหมู่สินค้า</DialogTitle>
        </DialogHeader>

        {/* รายการหมวดหมู่เดิม */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {categories.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีหมวดหมู่</p>
          )}
          {categories.map((cat) => (
            <div key={cat.id} className="border rounded-lg p-2.5 bg-gray-50">
              {editingId === cat.id ? (
                <div className="space-y-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditHasArea((v) => !v)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${editHasArea ? 'bg-amber-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editHasArea ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-xs text-gray-500">คำนวณ ตร.ม.</span>
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={cancelEdit}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" className="h-7 px-2 bg-green-600 text-white hover:bg-green-700" onClick={() => saveEdit(cat)} disabled={saving}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{cat.name}</span>
                    {cat.has_area_pricing && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">ตร.ม.</span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(cat)} className="p-1.5 rounded hover:bg-amber-50 text-amber-600">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCategory(cat)} className="p-1.5 rounded hover:bg-red-50 text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* เพิ่มหมวดหมู่ใหม่ */}
        <div className="border-t pt-3 space-y-2">
          <Label className="text-sm font-medium">เพิ่มหมวดหมู่ใหม่</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="เช่น ไม้พื้น, ประตู"
            className="h-9"
            onKeyDown={(e) => e.key === 'Enter' && addCategory()}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setNewHasArea((v) => !v)}
                className={`relative w-9 h-5 rounded-full transition-colors ${newHasArea ? 'bg-amber-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${newHasArea ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-xs text-gray-500">คำนวณราคา/ตร.ม.</span>
            </div>
            <Button
              onClick={addCategory}
              disabled={saving || !newName.trim()}
              style={{ backgroundColor: '#7B4F2E' }}
              className="text-white gap-1.5 h-8"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" /> เพิ่ม
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
