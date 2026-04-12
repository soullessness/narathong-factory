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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SalesTargetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesId: string
  salesName: string
  initialData?: {
    month: number
    year: number
    target_amount: number
    commission_rate: number
  }
  onSuccess?: () => void
}

const MONTHS = [
  { value: 1, label: 'มกราคม' },
  { value: 2, label: 'กุมภาพันธ์' },
  { value: 3, label: 'มีนาคม' },
  { value: 4, label: 'เมษายน' },
  { value: 5, label: 'พฤษภาคม' },
  { value: 6, label: 'มิถุนายน' },
  { value: 7, label: 'กรกฎาคม' },
  { value: 8, label: 'สิงหาคม' },
  { value: 9, label: 'กันยายน' },
  { value: 10, label: 'ตุลาคม' },
  { value: 11, label: 'พฤศจิกายน' },
  { value: 12, label: 'ธันวาคม' },
]

export function SalesTargetDialog({
  open,
  onOpenChange,
  salesId,
  salesName,
  initialData,
  onSuccess,
}: SalesTargetDialogProps) {
  const now = new Date()
  const [month, setMonth] = useState(initialData?.month ?? now.getMonth() + 1)
  const [year, setYear] = useState(initialData?.year ?? now.getFullYear())
  const [targetAmount, setTargetAmount] = useState(initialData?.target_amount?.toString() ?? '')
  const [commissionRate, setCommissionRate] = useState(initialData?.commission_rate?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/sales-targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sales_id: salesId,
          year,
          month,
          target_amount: parseFloat(targetAmount),
          commission_rate: parseFloat(commissionRate),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'เกิดข้อผิดพลาด')
        return
      }

      onOpenChange(false)
      onSuccess?.()
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setLoading(false)
    }
  }

  const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-gray-900">
            กำหนดเป้าหมาย — {salesName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Month / Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="month">เดือน</Label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">ปี (ค.ศ.)</Label>
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <Label htmlFor="target_amount">เป้ายอดขาย (บาท)</Label>
            <Input
              id="target_amount"
              type="number"
              min="0"
              step="1000"
              placeholder="เช่น 500000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              required
            />
          </div>

          {/* Commission Rate */}
          <div className="space-y-1.5">
            <Label htmlFor="commission_rate">อัตราคอมมิชชั่น (%)</Label>
            <Input
              id="commission_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="เช่น 3.5"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#2BA8D4' }}
              className="text-white hover:opacity-90"
            >
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
