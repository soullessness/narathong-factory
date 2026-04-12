'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface StepLogDialogProps {
  open: boolean
  onClose: () => void
  orderId: string
  stepId: string
  onSaved: () => void
}

export function StepLogDialog({
  open,
  onClose,
  orderId,
  stepId,
  onSaved,
}: StepLogDialogProps) {
  const [message, setMessage] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setMessage('')
    setQuantity('')
    setUnit('')
    setError(null)
    onClose()
  }

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError('กรุณากรอกข้อความ')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/production-orders/${orderId}/steps/${stepId}/logs`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message.trim(),
            quantity: quantity ? Number(quantity) : undefined,
            unit: unit.trim() || undefined,
          }),
        }
      )

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'เกิดข้อผิดพลาด')
        return
      }

      onSaved()
      handleClose()
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>บันทึกความคืบหน้า</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>ข้อความ *</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="บอกความคืบหน้าของงาน..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>จำนวน</Label>
              <Input
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>หน่วย</Label>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ชิ้น, แผ่น, ..."
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !message.trim()}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
