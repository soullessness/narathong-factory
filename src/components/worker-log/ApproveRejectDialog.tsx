'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Clock, User, Calendar, Package } from 'lucide-react'
import type { WorkerLog } from '@/types/worker-log'

interface ApproveRejectDialogProps {
  open: boolean
  log: WorkerLog | null
  onClose: () => void
  onDone: (updatedLog: WorkerLog) => void
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function ApproveRejectDialog({ open, log, onClose, onDone }: ApproveRejectDialogProps) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!log) return
    if (action === 'reject' && !notes.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/worker-logs/${log.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: notes.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      toast.success(action === 'approve' ? 'อนุมัติเรียบร้อย' : 'ปฏิเสธเรียบร้อย')
      onDone(json.data)
      setNotes('')
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  if (!log) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setNotes(''); onClose() } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: '#2BA8D4' }}>
            📋 อนุมัติ / ปฏิเสธบันทึกงาน
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Log detail */}
          <div className="bg-sky-50 rounded-xl p-4 space-y-2 border border-sky-100">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4 text-sky-700" />
              <span className="font-semibold">{log.worker?.full_name ?? '—'}</span>
              {log.department && (
                <span className="text-gray-400">· {log.department.name}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(log.log_date)}</span>
            </div>
            <p className="text-sm text-gray-800 leading-relaxed">{log.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {log.quantity != null && (
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>{log.quantity} {log.unit ?? ''}</span>
                </div>
              )}
              {log.hours_worked != null && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{log.hours_worked} ชม.</span>
                </div>
              )}
            </div>
            {log.project && (
              <span className="inline-block bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full text-xs">
                {log.project.name}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="reject_notes">
              หมายเหตุ <span className="text-gray-400 font-normal">(บังคับเมื่อปฏิเสธ)</span>
            </Label>
            <Textarea
              id="reject_notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุเหตุผลหรือข้อความเพิ่มเติม..."
              rows={2}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setNotes(''); onClose() }}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              onClick={() => handleAction('reject')}
            >
              <XCircle className="w-4 h-4" />
              ปฏิเสธ
            </Button>
            <Button
              type="button"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              onClick={() => handleAction('approve')}
            >
              <CheckCircle2 className="w-4 h-4" />
              อนุมัติ
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
