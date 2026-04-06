'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  ArrowRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  CRMProject,
  CRMStage,
  CRMStageLog,
  STAGE_CONFIG,
  STAGE_ORDER,
  CUSTOMER_TYPE_LABELS,
} from '@/types/crm'

interface ProjectDetailDialogProps {
  open: boolean
  project: CRMProject | null
  stageLogs: CRMStageLog[]
  onClose: () => void
  onEdit: () => void
  onStageChanged: (project: CRMProject) => void
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'd MMM yyyy', { locale: th })
  } catch {
    return dateStr
  }
}

export function ProjectDetailDialog({
  open,
  project,
  stageLogs,
  onClose,
  onEdit,
  onStageChanged,
}: ProjectDetailDialogProps) {
  const [changingStage, setChangingStage] = useState(false)
  const [newStage, setNewStage] = useState<CRMStage | ''>('')
  const [stageNote, setStageNote] = useState('')
  const [stageLoading, setStageLoading] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)

  if (!project) return null

  const currentConfig = STAGE_CONFIG[project.stage]

  const handleStageChange = async () => {
    if (!newStage) return
    setStageLoading(true)
    setStageError(null)
    try {
      const res = await fetch(`/api/projects/${project.id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, note: stageNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStageError(json.error || 'เกิดข้อผิดพลาด')
        return
      }
      onStageChanged(json.data)
      setChangingStage(false)
      setNewStage('')
      setStageNote('')
    } catch {
      setStageError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setStageLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <DialogTitle className="text-xl">{project.name}</DialogTitle>
              {project.project_code && (
                <p className="text-sm text-gray-500 mt-1">{project.project_code}</p>
              )}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge
                className={`${currentConfig.bgColor} ${currentConfig.textColor} border ${currentConfig.borderColor} font-medium`}
              >
                {currentConfig.label}
              </Badge>
              <Button size="icon" variant="ghost" onClick={onEdit}>
                <Edit className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> มูลค่าโปรเจค
              </p>
              <p className="font-semibold text-green-700">{formatCurrency(project.value)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> มัดจำ
              </p>
              <p className="font-semibold">{formatCurrency(project.deposit_amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> กำหนดส่ง
              </p>
              <p className="font-medium">{formatDate(project.deadline)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <User className="w-3 h-3" /> Sales ที่รับผิดชอบ
              </p>
              <p className="font-medium">{project.profiles?.full_name || '—'}</p>
            </div>
          </div>

          {project.notes && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
              <p className="text-sm text-gray-700">{project.notes}</p>
            </div>
          )}

          <Separator />

          {/* Customer Info */}
          {project.customers && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">ข้อมูลลูกค้า</h3>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{project.customers.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {CUSTOMER_TYPE_LABELS[project.customers.customer_type]}
                  </Badge>
                </div>
                {project.customers.contact_name && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> {project.customers.contact_name}
                  </p>
                )}
                {project.customers.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> {project.customers.phone}
                  </p>
                )}
                {project.customers.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> {project.customers.email}
                  </p>
                )}
                {'address' in project.customers && project.customers.address && (
                  <p className="text-sm text-gray-600 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />{' '}
                    {(project.customers as { address?: string }).address}
                  </p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Change Stage */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">เปลี่ยน Stage</h3>
              {!changingStage && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setChangingStage(true)}
                  className="gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> เปลี่ยน Stage
                </Button>
              )}
            </div>

            {changingStage && (
              <div className="space-y-3 bg-amber-50 rounded-lg p-4">
                <div className="space-y-2">
                  <Label>Stage ใหม่</Label>
                  <Select
                    value={newStage}
                    onValueChange={(v) => setNewStage(v as CRMStage)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือก Stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGE_ORDER.filter((s) => s !== project.stage).map((s) => (
                        <SelectItem key={s} value={s}>
                          {STAGE_CONFIG[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>หมายเหตุ (ไม่บังคับ)</Label>
                  <Textarea
                    value={stageNote}
                    onChange={(e) => setStageNote(e.target.value)}
                    placeholder="เหตุผลหรือหมายเหตุการเปลี่ยน stage"
                    rows={2}
                  />
                </div>
                {stageError && <p className="text-sm text-red-600">{stageError}</p>}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChangingStage(false)
                      setNewStage('')
                      setStageNote('')
                      setStageError(null)
                    }}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    size="sm"
                    disabled={!newStage || stageLoading}
                    onClick={handleStageChange}
                    style={{ backgroundColor: '#7B4F2E' }}
                    className="text-white"
                  >
                    {stageLoading ? 'กำลังบันทึก...' : 'ยืนยัน'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Stage Logs */}
          {stageLogs.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">ประวัติการเปลี่ยน Stage</h3>
                <div className="space-y-3">
                  {stageLogs.map((log) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                        <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                      </div>
                      <div className="pb-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {log.from_stage ? (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {STAGE_CONFIG[log.from_stage as CRMStage]?.label || log.from_stage}
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            </>
                          ) : null}
                          <Badge
                            className={`text-xs ${STAGE_CONFIG[log.to_stage as CRMStage]?.bgColor} ${STAGE_CONFIG[log.to_stage as CRMStage]?.textColor}`}
                          >
                            {STAGE_CONFIG[log.to_stage as CRMStage]?.label || log.to_stage}
                          </Badge>
                        </div>
                        {log.note && (
                          <p className="text-xs text-gray-500 mt-1">{log.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(log.changed_at)}
                          {log.profiles && ` • ${log.profiles.full_name}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
