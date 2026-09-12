'use client'

import { Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { WorkType, Unit } from '@/types/work-report'

export interface ItemRowData {
  worker_id: string
  work_type_id: string
  quantity: string
  unit_id: string
  hours_worked: string
  good_quantity: string
  reject_quantity: string
  note: string
}

interface Worker {
  id: string
  full_name: string
}

interface WorkReportItemRowProps {
  index: number
  data: ItemRowData
  workers: Worker[]
  workTypes: WorkType[]
  units: Unit[]
  onChange: (index: number, field: keyof ItemRowData, value: string) => void
  onRemove: (index: number) => void
  canRemove?: boolean
  disabled?: boolean
}

export function WorkReportItemRow({
  index,
  data,
  workers,
  workTypes,
  units,
  onChange,
  onRemove,
  canRemove = true,
  disabled = false,
}: WorkReportItemRowProps) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      {/* ลำดับ */}
      <td className="py-2 px-2 text-xs text-gray-400 w-8 text-center">{index + 1}</td>

      {/* พนักงาน */}
      <td className="py-2 px-2">
        <Select
          value={data.worker_id}
          onValueChange={(v) => onChange(index, 'worker_id', v ?? '')}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs w-full min-w-[120px]">
            <SelectValue placeholder="เลือกพนักงาน" />
          </SelectTrigger>
          <SelectContent>
            {workers.map((w) => (
              <SelectItem key={w.id} value={w.id} className="text-xs">
                {w.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* ประเภทงาน */}
      <td className="py-2 px-2">
        <Select
          value={data.work_type_id}
          onValueChange={(v) => {
            const val = v ?? ''
            onChange(index, 'work_type_id', val)
            // Auto-fill unit from work type default
            const wt = workTypes.find((w) => w.id === val)
            if (wt?.default_unit_id) {
              onChange(index, 'unit_id', wt.default_unit_id)
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs w-full min-w-[120px]">
            <SelectValue placeholder="เลือกประเภทงาน" />
          </SelectTrigger>
          <SelectContent>
            {workTypes.map((wt) => (
              <SelectItem key={wt.id} value={wt.id} className="text-xs">
                {wt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* จำนวน */}
      <td className="py-2 px-2 w-24">
        <Input
          type="number"
          min="0"
          value={data.quantity}
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          className="h-8 text-xs"
          placeholder="0"
          disabled={disabled}
        />
      </td>

      {/* หน่วย */}
      <td className="py-2 px-2 w-24">
        <Select
          value={data.unit_id}
          onValueChange={(v) => onChange(index, 'unit_id', v ?? '')}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="หน่วย" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name} ({u.symbol})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>

      {/* ชั่วโมง */}
      <td className="py-2 px-2 w-20">
        <Input
          type="number"
          min="0"
          step="0.5"
          value={data.hours_worked}
          onChange={(e) => onChange(index, 'hours_worked', e.target.value)}
          className="h-8 text-xs"
          placeholder="0"
          disabled={disabled}
        />
      </td>

      {/* ดี/เสีย */}
      <td className="py-2 px-2 w-20">
        <Input
          type="number"
          min="0"
          value={data.good_quantity}
          onChange={(e) => onChange(index, 'good_quantity', e.target.value)}
          className="h-8 text-xs"
          placeholder="0"
          disabled={disabled}
        />
      </td>
      <td className="py-2 px-2 w-20">
        <Input
          type="number"
          min="0"
          value={data.reject_quantity}
          onChange={(e) => onChange(index, 'reject_quantity', e.target.value)}
          className="h-8 text-xs"
          placeholder="0"
          disabled={disabled}
        />
      </td>

      {/* หมายเหตุ */}
      <td className="py-2 px-2">
        <Input
          value={data.note}
          onChange={(e) => onChange(index, 'note', e.target.value)}
          className="h-8 text-xs"
          placeholder="หมายเหตุ"
          disabled={disabled}
        />
      </td>

      {/* ลบ */}
      <td className="py-2 px-2 w-10">
        {canRemove && !disabled && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-400 hover:text-red-600 transition-colors p-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </td>
    </tr>
  )
}
