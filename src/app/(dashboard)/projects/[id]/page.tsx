'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  ArrowLeft,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Edit,
  ArrowRight,
  Building2,
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
import { ProjectDialog } from '@/components/crm/ProjectDialog'

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'd MMMM yyyy', { locale: th })
  } catch {
    return dateStr
  }
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(new Date(dateStr), 'd MMM yyyy HH:mm', { locale: th })
  } catch {
    return dateStr
  }
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [project, setProject] = useState<CRMProject | null>(null)
  const [stageLogs, setStageLogs] = useState<CRMStageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stage change
  const [changingStage, setChangingStage] = useState(false)
  const [newStage, setNewStage] = useState<CRMStage | ''>('')
  const [stageNote, setStageNote] = useState('')
  const [stageLoading, setStageLoading] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false)

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'ไม่พบโปรเจค')
        return
      }
      setProject(json.data)
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    }
  }, [id])

  const fetchStageLogs = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${id}/stage`)
      if (res.ok) {
        const json = await res.json()
        setStageLogs(json.data || [])
      }
    } catch {
      setStageLogs([])
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchProject(), fetchStageLogs()])
      setLoading(false)
    }
    load()
  }, [fetchProject, fetchStageLogs])

  const handleStageChange = async () => {
    if (!newStage || !project) return
    setStageLoading(true)
    setStageError(null)
    try {
      const res = await fetch(`/api/projects/${id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, note: stageNote }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStageError(json.error || 'เกิดข้อผิดพลาด')
        return
      }
      setProject(json.data)
      await fetchStageLogs()
      setChangingStage(false)
      setNewStage('')
      setStageNote('')
    } catch {
      setStageError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setStageLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <p className="text-sm text-red-700">{error || 'ไม่พบโปรเจค'}</p>
        </div>
      </div>
    )
  }

  const currentConfig = STAGE_CONFIG[project.stage]

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back + Title */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/crm')} className="gap-1 mt-1">
          <ArrowLeft className="w-4 h-4" /> CRM
        </Button>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {project.project_code && (
                <p className="text-sm text-gray-500 mt-0.5">{project.project_code}</p>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Badge
                className={`${currentConfig.bgColor} ${currentConfig.textColor} border ${currentConfig.borderColor} text-sm px-3 py-1`}
              >
                {currentConfig.label}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => setShowEdit(true)} className="gap-1">
                <Edit className="w-3.5 h-3.5" /> แก้ไข
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Project Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ข้อมูลโปรเจค</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" /> มูลค่าโปรเจค
                  </p>
                  <p className="font-semibold text-lg text-green-700">
                    {formatCurrency(project.value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <DollarSign className="w-3 h-3" /> มัดจำ
                  </p>
                  <p className="font-semibold text-lg">{formatCurrency(project.deposit_amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <Calendar className="w-3 h-3" /> กำหนดส่ง
                  </p>
                  <p className="font-medium">{formatDate(project.deadline)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                    <User className="w-3 h-3" /> Sales ที่รับผิดชอบ
                  </p>
                  <p className="font-medium">{project.sales_profile?.full_name || '—'}</p>
                </div>
              </div>

              {project.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">หมายเหตุ</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{project.notes}</p>
                  </div>
                </>
              )}

              <Separator />
              <div className="flex gap-4 text-xs text-gray-400">
                <span>สร้างเมื่อ: {formatDateTime(project.created_at)}</span>
                <span>แก้ไขล่าสุด: {formatDateTime(project.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          {project.customers && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> ข้อมูลลูกค้า
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-800">{project.customers.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {CUSTOMER_TYPE_LABELS[project.customers.customer_type]}
                  </Badge>
                </div>
                {project.customers.contact_name && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> {project.customers.contact_name}
                  </p>
                )}
                {project.customers.phone && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" /> {project.customers.phone}
                  </p>
                )}
                {project.customers.email && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" /> {project.customers.email}
                  </p>
                )}
                {'address' in project.customers && (project.customers as { address?: string }).address && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />{' '}
                    {(project.customers as { address?: string }).address}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Stage + Timeline */}
        <div className="space-y-6">
          {/* Change Stage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">เปลี่ยน Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">ปัจจุบัน:</span>
                <Badge
                  className={`${currentConfig.bgColor} ${currentConfig.textColor} border ${currentConfig.borderColor}`}
                >
                  {currentConfig.label}
                </Badge>
              </div>

              {!changingStage ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setChangingStage(true)}
                  className="w-full gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> เปลี่ยน Stage
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Stage ใหม่</Label>
                    <Select value={newStage} onValueChange={(v) => setNewStage(v as CRMStage)}>
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
                  <div className="space-y-1.5">
                    <Label className="text-xs">หมายเหตุ</Label>
                    <Textarea
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="เหตุผลหรือหมายเหตุ"
                      rows={2}
                      className="text-sm"
                    />
                  </div>
                  {stageError && <p className="text-xs text-red-600">{stageError}</p>}
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
                      className="flex-1"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      size="sm"
                      disabled={!newStage || stageLoading}
                      onClick={handleStageChange}
                      style={{ backgroundColor: '#7B4F2E' }}
                      className="text-white flex-1"
                    >
                      {stageLoading ? '...' : 'ยืนยัน'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stage Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">ประวัติ Stage</CardTitle>
            </CardHeader>
            <CardContent>
              {stageLogs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีประวัติ</p>
              ) : (
                <div className="space-y-3">
                  {stageLogs.map((log, idx) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-amber-500' : 'bg-gray-300'}`}
                        />
                        {idx < stageLogs.length - 1 && (
                          <div className="w-0.5 bg-gray-200 flex-1 mt-1" />
                        )}
                      </div>
                      <div className="pb-3 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {log.from_stage && (
                            <>
                              <span className="text-xs text-gray-400">
                                {STAGE_CONFIG[log.from_stage as CRMStage]?.label || log.from_stage}
                              </span>
                              <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                            </>
                          )}
                          <Badge
                            className={`text-xs px-1.5 py-0 ${STAGE_CONFIG[log.to_stage as CRMStage]?.bgColor} ${STAGE_CONFIG[log.to_stage as CRMStage]?.textColor}`}
                          >
                            {STAGE_CONFIG[log.to_stage as CRMStage]?.label || log.to_stage}
                          </Badge>
                        </div>
                        {log.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{log.note}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDateTime(log.changed_at)}
                        </p>
                        {log.changer_profile && (
                          <p className="text-xs text-gray-400">{log.changer_profile.full_name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <ProjectDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSaved={(saved) => {
          setProject(saved)
          setShowEdit(false)
        }}
        initialStage={project.stage}
        editProject={project}
      />
    </div>
  )
}
