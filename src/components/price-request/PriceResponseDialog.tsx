'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { PriceRequest, PRODUCT_TYPE_LABELS, STATUS_LABELS } from '@/types/price-request'

interface PriceResponseDialogProps {
  open: boolean
  request: PriceRequest | null
  onClose: () => void
  onSaved: () => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  quoted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  } catch { return dateStr }
}

export function PriceResponseDialog({ open, request, onClose, onSaved }: PriceResponseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [unitPrice, setUnitPrice] = useState('')
  const [productionDays, setProductionDays] = useState('')
  const [notes, setNotes] = useState('')

  const quantity = request?.quantity ?? 1
  const totalPrice = unitPrice ? Number(unitPrice) * quantity : 0

  useEffect(() => {
    if (!open) {
      setUnitPrice('')
      setProductionDays('')
      setNotes('')
    }
  }, [open])

  if (!request) return null

  const isAlreadyQuoted = request.status === 'quoted'

  const handleSubmit = async () => {
    if (!unitPrice || Number(unitPrice) <= 0) {
      toast.error('กรุณาระบุราคาต่อหน่วย')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/price-requests/${request.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_price: Number(unitPrice),
          total_price: totalPrice,
          production_days: productionDays ? Number(productionDays) : null,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      toast.success('ยืนยันราคาสำเร็จ')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!confirm('ยืนยันการปฏิเสธคำขอนี้?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/price-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'เกิดข้อผิดพลาด')
      }
      toast.success('ปฏิเสธคำขอแล้ว')
      onSaved()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleSetReviewing = async () => {
    setLoading(true)
    try {
      await fetch(`/api/price-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'reviewing' }),
      })
      toast.success('อัปเดตสถานะเป็น "กำลังพิจารณา"')
      onSaved()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold" style={{ color: '#7B4F2E' }}>
            คำขอราคาสินค้า
          </DialogTitle>
        </DialogHeader>

        {/* Request info */}
        <div className="bg-amber-50 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-800">{request.product_name}</p>
              <p className="text-sm text-gray-500">
                {PRODUCT_TYPE_LABELS[request.product_type] ?? request.product_type}
              </p>
            </div>
            <Badge
              className={`text-xs border ${statusColors[request.status]}`}
              variant="outline"
            >
              {STATUS_LABELS[request.status] ?? request.status}
            </Badge>
          </div>

          {request.spec && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">สเปค</p>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-2 whitespace-pre-wrap">
                {request.spec}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">จำนวน</p>
              <p className="font-medium">{request.quantity.toLocaleString('th-TH')} {request.unit}</p>
            </div>
            {request.deadline_date && (
              <div>
                <p className="text-xs text-gray-500">ต้องการภายใน</p>
                <p className="font-medium">{formatDate(request.deadline_date)}</p>
              </div>
            )}
            {request.requester?.full_name && (
              <div>
                <p className="text-xs text-gray-500">ผู้ขอ</p>
                <p className="font-medium">{request.requester.full_name}</p>
              </div>
            )}
            {request.project?.name && (
              <div>
                <p className="text-xs text-gray-500">โปรเจค</p>
                <p className="font-medium">{request.project.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* If already quoted — show existing response */}
        {isAlreadyQuoted && request.response && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-green-700">✅ ราคาที่แจ้งไปแล้ว</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ราคาต่อหน่วย</span>
              <span className="font-medium">
                {request.response.unit_price.toLocaleString('th-TH')} บาท
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">ราคารวม</span>
              <span className="font-bold text-green-700">
                {request.response.total_price.toLocaleString('th-TH')} บาท
              </span>
            </div>
            {request.response.production_days && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ระยะเวลาผลิต</span>
                <span className="font-medium">{request.response.production_days} วัน</span>
              </div>
            )}
            {request.response.notes && (
              <p className="text-xs text-gray-500 mt-1">{request.response.notes}</p>
            )}
          </div>
        )}

        {/* Response form — only if not yet quoted/rejected */}
        {!isAlreadyQuoted && request.status !== 'rejected' && (
          <div className="space-y-4">
            <p className="text-sm font-semibold text-gray-700">ตอบราคา</p>

            {/* Set reviewing button */}
            {request.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={handleSetReviewing}
                disabled={loading}
              >
                🔍 เปลี่ยนสถานะเป็น &quot;กำลังพิจารณา&quot;
              </Button>
            )}

            <div className="space-y-1.5">
              <Label>ราคาต่อหน่วย (บาท) <span className="text-red-500">*</span></Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>

            {/* Auto-calculated total */}
            {unitPrice && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-sm text-gray-600">
                  {Number(unitPrice).toLocaleString('th-TH')} × {quantity} {request.unit}
                </span>
                <span className="text-base font-bold" style={{ color: '#7B4F2E' }}>
                  = {totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>ระยะเวลาผลิต (วัน)</Label>
              <Input
                type="number"
                min={1}
                placeholder="เช่น 14"
                value={productionDays}
                onChange={(e) => setProductionDays(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>หมายเหตุ</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม เงื่อนไข หรือข้อกำหนด"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            ปิด
          </Button>
          {!isAlreadyQuoted && request.status !== 'rejected' && (
            <>
              <Button
                variant="outline"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleReject}
                disabled={loading}
              >
                ปฏิเสธ
              </Button>
              <Button
                className="flex-1 text-white"
                style={{ backgroundColor: '#7B4F2E' }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'กำลังบันทึก...' : 'ยืนยันราคา'}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
