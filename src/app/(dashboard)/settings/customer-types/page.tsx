"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type CustomerType = {
  id: string
  name: string
  description: string
  color: string
  is_active: boolean
  sort_order: number
}

const DEFAULT_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"]

export default function CustomerTypesPage() {
  const [types, setTypes] = useState<CustomerType[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerType | null>(null)
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6" })

  const supabase = createClient()

  useEffect(() => {
    fetchTypes()
  }, [])

  async function fetchTypes() {
    setLoading(true)
    const { data, error } = await supabase
      .from("customer_types")
      .select("*")
      .order("sort_order")
    
    if (!error && data) setTypes(data)
    setLoading(false)
  }

  async function handleSave() {
    if (editing) {
      // Update
      const { error } = await supabase
        .from("customer_types")
        .update({ 
          name: form.name, 
          description: form.description, 
          color: form.color 
        })
        .eq("id", editing.id)
      
      if (!error) {
        await fetchTypes()
        setOpen(false)
        setEditing(null)
        setForm({ name: "", description: "", color: "#3b82f6" })
      }
    } else {
      // Create
      const { error } = await supabase
        .from("customer_types")
        .insert({ 
          name: form.name, 
          description: form.description, 
          color: form.color,
          sort_order: types.length + 1
        })
      
      if (!error) {
        await fetchTypes()
        setOpen(false)
        setForm({ name: "", description: "", color: "#3b82f6" })
      }
    }
  }

  async function handleDelete(id: string) {
    if (confirm("ต้องการลบ?")) {
      const { error } = await supabase
        .from("customer_types")
        .delete()
        .eq("id", id)
      
      if (!error) await fetchTypes()
    }
  }

  function openEdit(type: CustomerType) {
    setEditing(type)
    setForm({ name: type.name, description: type.description || "", color: type.color })
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ประเภทลูกค้า</h1>
          <p className="text-muted-foreground">จัดการประเภทลูกค้าในระบบ</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", description: "", color: "#3b82f6" }); setOpen(true) }}>
          + เพิ่มประเภทลูกค้า
        </Button>
      </div>

      {loading ? (
        <p>กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map((type) => (
            <Card key={type.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: type.color }}
                  />
                  <CardTitle className="text-lg">{type.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{type.description}</p>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(type)}>
                    แก้ไข
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(type.id)}>
                    ลบ
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "แก้ไขประเภทลูกค้า" : "เพิ่มประเภทลูกค้า"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>ชื่อ</Label>
              <Input 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น retail, contractor"
              />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Input 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="เช่น ลูกค้าทั่วไป"
              />
            </div>
            <div>
              <Label>สี</Label>
              <div className="flex gap-2 mt-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`w-8 h-8 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-black' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setForm({ ...form, color: c })}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
