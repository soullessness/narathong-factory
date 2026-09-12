'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { WorkReport } from '@/types/work-report'

interface ApproveDialogProps {
  open: boolean
  report: WorkReport | null
  onClose: () => void
  onDone: (updated: WorkReport) => void
}

export function ApproveDialog({ open, report, onClose, onDone }: ApproveDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!report) return
    if (action === 'rejected' && !reason.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/work-reports/${report.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: reason.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'เกิดข้อผิดพลาด')

      toast.success(action === 'approved' ? 'อนุมัติรายงานเรียบร้อย' : 'ปฏิเสธรายงานเรียบร้อย')
      setReason('')
      onDone(json.data)
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>อนุมัติ / ปฏิเสธ รายงาน</DialogTitle>
        </DialogHeader>

        {report && (
          <div className="space-y-4">
            <div className="bg-sky-50 rounded-lg p-3 text-sm text-sky-700">
              <p>
                <strong>วันที่:</strong>{' '}
                {new Date(report.report_date).toLocaleDateString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              {report.team && (
                <p>
                  <strong>ทีม:</strong> {report.team.name}
                </p>
              )}
              {report.creator && (
                <p>
                  <strong>สร้างโดย:</strong> {report.creator.full_name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">
                เหตุผล{' '}
                <span className="text-gray-400 font-normal">(จำเป็นสำหรับการปฏิเสธ)</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล หรือหมายเหตุ..."
                rows={3}
                className="text-sm resize-none"
                disabled={loading}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading} className="flex-1">
            ยกเลิก
          </Button>
          <Button
            onClick={() => handleAction('rejected')}
            disabled={loading}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white"
          >
            <XCircle className="w-4 h-4 mr-1.5" />
            {loading ? 'กำลังดำเนินการ...' : 'ปฏิเสธ'}
          </Button>
          <Button
            onClick={() => handleAction('approved')}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            {loading ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
