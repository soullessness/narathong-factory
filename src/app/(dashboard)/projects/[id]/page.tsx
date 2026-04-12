'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
  FileText,
  Plus,
  Trash2,
  Zap,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Truck,
  Wrench,
  MessageSquare,
  ExternalLink,
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
import type { Quotation } from '@/types/quotation'
import { ProjectDialog } from '@/components/crm/ProjectDialog'
import { ProductionOrderDialog } from '@/components/production/ProductionOrderDialog'

const QUOTATION_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600 border-gray-300' },
  sent: { label: 'ส่งแล้ว', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  accepted: { label: 'ยืนยัน', className: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-700 border-red-300' },
  expired: { label: 'หมดอายุ', className: 'bg-orange-100 text-orange-700 border-orange-300' },
}

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
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Stage change
  const [changingStage, setChangingStage] = useState(false)
  const [newStage, setNewStage] = useState<CRMStage | ''>('')
  const [stageNote, setStageNote] = useState('')
  const [stageValue, setStageValue] = useState('')
  const [stageDeposit, setStageDeposit] = useState('')
  const [stageLoading, setStageLoading] = useState(false)
  const [stageError, setStageError] = useState<string | null>(null)

  // Edit dialog
  const [showEdit, setShowEdit] = useState(false)

  // Delete dialog
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Production order dialog
  const [showProductionDialog, setShowProductionDialog] = useState(false)

  const PRODUCTION_ELIGIBLE_STAGES = ['deposit', 'production', 'delivery', 'installation', 'completed']

  // Stage-gated action flags
  const canCreateQuotation = (['quotation', 'presentation'] as CRMStage[]).includes(project?.stage as CRMStage)
  const canCreateProductionOrder = (['deposit'] as CRMStage[]).includes(project?.stage as CRMStage)
  const canViewProductionOrders = (['production', 'delivery', 'installation', 'completed'] as CRMStage[]).includes(project?.stage as CRMStage)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/projects')
      }
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

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

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations?projectId=${id}`)
      if (res.ok) {
        const json = await res.json()
        setQuotations(json.data || [])
      }
    } catch {
      setQuotations([])
    }
  }, [id])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await Promise.all([fetchProject(), fetchStageLogs(), fetchQuotations()])
      setLoading(false)
    }
    load()
  }, [fetchProject, fetchStageLogs, fetchQuotations])

  const handleStageChange = async () => {
    if (!newStage || !project) return
    setStageLoading(true)
    setStageError(null)
    try {
      const res = await fetch(`/api/projects/${id}/stage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          note: stageNote,
          value: stageValue ? parseFloat(stageValue) : undefined,
          deposit_amount: stageDeposit ? parseFloat(stageDeposit) : undefined,
        }),
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
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
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
        <Button variant="ghost" size="sm" onClick={() => router.push('/projects')} className="gap-1 mt-1">
          <ArrowLeft className="w-4 h-4" /> โปรเจค
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDelete(true)}
                className="gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบ
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

          {/* Stage Actions Card */}
          <Card className="border-2" style={{ borderColor: '#2BA8D4' }}>
            <CardHeader className="pb-3" style={{ backgroundColor: 'rgba(43,168,212,0.06)' }}>
              <CardTitle className="text-base flex items-center gap-2" style={{ color: '#2BA8D4' }}>
                <Zap className="w-4 h-4" /> Actions — {currentConfig.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {/* lead */}
              {project.stage === 'lead' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">ติดต่อลูกค้า</p>
                    <p className="text-xs text-gray-500 mt-0.5">เพิ่มข้อมูลลูกค้าและติดต่อเพื่อนัดหมาย</p>
                  </div>
                </div>
              )}

              {/* presentation */}
              {project.stage === 'presentation' && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-700">นัดนำเสนอ</p>
                    <p className="text-xs text-blue-500 mt-0.5">บันทึกการติดต่อและนัด site visit</p>
                  </div>
                </div>
              )}

              {/* quotation — แสดงปุ่ม "สร้างใบเสนอราคา" */}
              {canCreateQuotation && (
                <div className="space-y-2">
                  <Link href={`/quotations/${id}/new`}>
                    <Button
                      className="w-full gap-2 text-white"
                      style={{ backgroundColor: '#2BA8D4' }}
                    >
                      <FileText className="w-4 h-4" /> สร้างใบเสนอราคา
                    </Button>
                  </Link>
                  {project.stage === 'quotation' && (
                    <p className="text-xs text-gray-400 text-center">รอการตอบรับใบเสนอราคา</p>
                  )}
                </div>
              )}

              {/* deposit — ปุ่ม "สร้าง Production Order" + แสดงยอดมัดจำ */}
              {canCreateProductionOrder && (
                <div className="space-y-3">
                  {project.deposit_amount != null && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm text-green-700 font-medium">ยอดมัดจำที่รับ</span>
                      <span className="text-sm font-bold text-green-800">
                        {formatCurrency(project.deposit_amount)}
                      </span>
                    </div>
                  )}
                  <Button
                    className="w-full gap-2 text-white"
                    style={{ backgroundColor: '#2BA8D4' }}
                    onClick={() => setShowProductionDialog(true)}
                  >
                    <ClipboardList className="w-4 h-4" /> สร้าง Production Order
                  </Button>
                </div>
              )}

              {/* production — ปุ่ม "ดู Production Orders" */}
              {canViewProductionOrders && project.stage === 'production' && (
                <div className="space-y-2">
                  <Link href={`/production-orders?projectId=${id}`}>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-2"
                      style={{ borderColor: '#2BA8D4', color: '#2BA8D4' }}
                    >
                      <ExternalLink className="w-4 h-4" /> ดู Production Orders
                    </Button>
                  </Link>
                  <p className="text-xs text-orange-500 text-center flex items-center justify-center gap-1">
                    <Wrench className="w-3 h-3" /> อยู่ระหว่างการผลิต
                  </p>
                </div>
              )}

              {/* delivery */}
              {project.stage === 'delivery' && (
                <div className="space-y-2">
                  <Link href={`/production-orders?projectId=${id}`}>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-2"
                      style={{ borderColor: '#2BA8D4', color: '#2BA8D4' }}
                    >
                      <ExternalLink className="w-4 h-4" /> ดู Production Orders
                    </Button>
                  </Link>
                  <div className="flex items-center justify-center gap-1 p-2 rounded-lg bg-purple-50 border border-purple-200">
                    <Truck className="w-4 h-4 text-purple-500" />
                    <p className="text-xs text-purple-600 font-medium">อยู่ระหว่างจัดส่ง</p>
                  </div>
                </div>
              )}

              {/* installation */}
              {project.stage === 'installation' && (
                <div className="space-y-2">
                  <Link href={`/production-orders?projectId=${id}`}>
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-2"
                      style={{ borderColor: '#2BA8D4', color: '#2BA8D4' }}
                    >
                      <ExternalLink className="w-4 h-4" /> ดู Production Orders
                    </Button>
                  </Link>
                  <div className="flex items-center justify-center gap-1 p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                    <Wrench className="w-4 h-4 text-indigo-500" />
                    <p className="text-xs text-indigo-600 font-medium">อยู่ระหว่างติดตั้ง</p>
                  </div>
                </div>
              )}

              {/* completed */}
              {project.stage === 'completed' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <p className="text-sm font-medium text-emerald-700">โปรเจกต์สำเร็จ 🎉</p>
                  </div>
                  {project.value != null && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-sm text-emerald-700">มูลค่าทั้งหมด</span>
                      <span className="text-sm font-bold text-emerald-800">
                        {formatCurrency(project.value)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* cancelled */}
              {project.stage === 'cancelled' && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm font-medium text-red-600">โปรเจกต์ถูกยกเลิก</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotation Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" /> ใบเสนอราคา
                </CardTitle>
                {canCreateQuotation && (
                  <Link href={`/quotations/${id}/new`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Plus className="w-3.5 h-3.5" /> สร้างใบเสนอราคา
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {quotations.length === 0 ? (
                <div className="text-center py-6">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">ยังไม่มีใบเสนอราคา</p>
                  {canCreateQuotation && (
                    <Link href={`/quotations/${id}/new`}>
                      <Button
                        size="sm"
                        className="mt-3 gap-1"
                        style={{ backgroundColor: '#2BA8D4' }}
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                        <span className="text-white">สร้างใบแรก</span>
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {quotations.map((q) => {
                    const statusConf =
                      QUOTATION_STATUS_LABEL[q.status] || QUOTATION_STATUS_LABEL.draft
                    return (
                      <Link
                        key={q.id}
                        href={`/quotations/${id}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {q.quotation_number}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(q.created_at), 'd MMM yyyy', { locale: th })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-green-700">
                            {new Intl.NumberFormat('th-TH', {
                              minimumFractionDigits: 0,
                            }).format(q.total)}{' '}
                            ฿
                          </p>
                          <Badge className={`${statusConf.className} border text-xs`}>
                            {statusConf.label}
                          </Badge>
                        </div>
                      </Link>
                    )
                  })}
                  <Link
                    href={`/quotations/${id}`}
                    className="text-xs text-sky-700 hover:underline flex items-center gap-1 mt-1"
                  >
                    ดูทั้งหมด ({quotations.length} รายการ)
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Production Order Section */}
          {PRODUCTION_ELIGIBLE_STAGES.includes(project.stage) && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    🏭 การผลิต
                  </CardTitle>
                  {canCreateProductionOrder && (
                    <Button
                      size="sm"
                      onClick={() => setShowProductionDialog(true)}
                      style={{ backgroundColor: '#2BA8D4' }}
                      className="text-white gap-1 h-7 text-xs"
                    >
                      <Plus className="w-3 h-3" /> สร้าง Production Order
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {canCreateProductionOrder ? (
                  <p className="text-sm text-gray-500">
                    โปรเจคนี้พร้อมเริ่มการผลิตแล้ว กดปุ่มเพื่อสร้าง Production Order
                  </p>
                ) : (
                  <Link href={`/production-orders?projectId=${id}`}>
                    <Button variant="outline" size="sm" className="gap-1 w-full">
                      <ExternalLink className="w-3.5 h-3.5" /> ดู Production Orders ทั้งหมด
                    </Button>
                  </Link>
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
                  {(newStage === 'quotation' || newStage === 'deposit') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">มูลค่าโปรเจค (บาท)</Label>
                      <input
                        type="number"
                        value={stageValue}
                        onChange={(e) => setStageValue(e.target.value)}
                        placeholder="0.00"
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
                  {newStage === 'deposit' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">ยอดมัดจำ (บาท)</Label>
                      <input
                        type="number"
                        value={stageDeposit}
                        onChange={(e) => setStageDeposit(e.target.value)}
                        placeholder="0.00"
                        className="w-full border rounded-md px-3 py-1.5 text-sm"
                      />
                    </div>
                  )}
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
                        setStageValue('')
                        setStageDeposit('')
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
                      style={{ backgroundColor: '#2BA8D4' }}
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
                          className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${idx === 0 ? 'bg-sky-500' : 'bg-gray-300'}`}
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

      {/* Delete Confirm Dialog */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบโปรเจค</AlertDialogTitle>
            <AlertDialogDescription>
              ยืนยันการลบโปรเจค &ldquo;{project.name}&rdquo;? การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'กำลังลบ...' : 'ลบโปรเจค'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Production Order Dialog */}
      <ProductionOrderDialog
        open={showProductionDialog}
        onClose={() => setShowProductionDialog(false)}
        preselectedProjectId={project.id}
      />
    </div>
  )
}
