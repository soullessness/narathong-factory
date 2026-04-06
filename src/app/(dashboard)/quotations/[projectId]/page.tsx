'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ArrowLeft, Plus, FileText, Calendar, DollarSign, Download, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Quotation } from '@/types/quotation'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  sent: { label: 'ส่งแล้ว', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  accepted: { label: 'ยืนยันแล้ว', className: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'ปฏิเสธ', className: 'bg-red-100 text-red-700 border-red-300' },
  expired: { label: 'หมดอายุ', className: 'bg-orange-100 text-orange-700 border-orange-300' },
}

function parseQuotationMeta(q: Quotation) {
  const metaMatch = (q.notes || '').match(/__META__([\s\S]*?)__END__/)
  if (metaMatch) {
    try {
      const meta = JSON.parse(metaMatch[1])
      return {
        ...q,
        discount_type: meta.discount_type || 'amount',
        vat_enabled: meta.vat_enabled ?? true,
        vat_amount: meta.vat_amount || 0,
        notes: (q.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim(),
      } as Quotation
    } catch {
      // ignore
    }
  }
  return { ...q, discount_type: 'amount' as const, vat_enabled: true, vat_amount: 0 }
}

export default function QuotationListPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.projectId as string

  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchQuotations = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotations?projectId=${projectId}`)
      const json = await res.json()
      if (res.ok) {
        setQuotations((json.data || []).map(parseQuotationMeta))
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchQuotations()
  }, [fetchQuotations])

  const handleDownloadPDF = (quotationId: string, quotationNumber: string) => {
    const link = document.createElement('a')
    link.href = `/api/quotations/${quotationId}/pdf`
    link.download = `${quotationNumber}.pdf`
    link.click()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/quotations/${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'ลบไม่สำเร็จ')
      }
      toast.success(`ลบใบเสนอราคา ${deleteTarget.quotation_number} สำเร็จ`)
      setDeleteTarget(null)
      await fetchQuotations()
    } catch (err) {
      toast.error(`เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : 'unknown'}`)
    } finally {
      setDeleting(false)
    }
  }

  const projectName = quotations[0]?.projects?.name || 'โปรเจค'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${projectId}`)} className="gap-1">
            <ArrowLeft className="w-4 h-4" /> กลับ
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ใบเสนอราคา</h1>
            <p className="text-sm text-gray-500">{projectName}</p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/quotations/${projectId}/new`)}
          style={{ backgroundColor: '#7B4F2E' }}
          className="text-white gap-2"
        >
          <Plus className="w-4 h-4" /> สร้างใบเสนอราคา
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quotations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <FileText className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500">ยังไม่มีใบเสนอราคา</p>
            <Button
              onClick={() => router.push(`/quotations/${projectId}/new`)}
              style={{ backgroundColor: '#7B4F2E' }}
              className="text-white gap-2"
            >
              <Plus className="w-4 h-4" /> สร้างใบแรก
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {quotations.map((q) => {
            const statusConf = STATUS_LABEL[q.status] || STATUS_LABEL.draft
            return (
              <Card key={q.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base font-bold">
                        {q.quotation_number}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {q.projects?.customers?.name}
                      </p>
                    </div>
                    <Badge className={`${statusConf.className} border text-xs`}>
                      {statusConf.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        {format(new Date(q.created_at), 'd MMM yyyy', { locale: th })}
                      </span>
                    </div>
                    {q.valid_until && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-orange-400" />
                        <span>
                          หมดอายุ:{' '}
                          {format(new Date(q.valid_until), 'd MMM yyyy', { locale: th })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-green-700">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>
                        {new Intl.NumberFormat('th-TH', {
                          minimumFractionDigits: 2,
                        }).format(q.total)}{' '}
                        บาท
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleDownloadPDF(q.id, q.quotation_number || q.id)}
                    >
                      <Download className="w-3.5 h-3.5" /> ดาวน์โหลด PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/quotations/${q.id}/pdf`, '_blank')}
                      className="gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> ดู PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/quotations/${projectId}/edit/${q.id}`)}
                      className="gap-1.5 text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> แก้ไข
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTarget(q)}
                      className="gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> ลบ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบใบเสนอราคา</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบใบเสนอราคา{' '}
              <span className="font-semibold text-gray-800">
                {deleteTarget?.quotation_number}
              </span>{' '}
              ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'ลบใบเสนอราคา'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
