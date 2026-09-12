'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, Users, User, Package, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/work-report/StatusBadge'
import { ApproveDialog } from '@/components/work-report/ApproveDialog'
import { useUserRole } from '@/hooks/useUserRole'
import type { WorkReport } from '@/types/work-report'

interface WorkReportDetailPageProps {
  params: Promise<{ id: string }>
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function WorkReportDetailPage({ params }: WorkReportDetailPageProps) {
  const { id } = use(params)
  const { role, userId } = useUserRole()
  const userRole = role ?? 'worker'

  const [report, setReport] = useState<WorkReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [approveOpen, setApproveOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isManager = ['admin', 'factory_manager', 'team_lead'].includes(userRole)
  const canApprove = isManager && report?.status === 'submitted'
  const isOwner = report?.created_by === userId
  const isDraft = report?.status === 'draft'
  const canSubmit = isOwner && isDraft

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/work-reports/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
        setReport(json.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

  const handleSubmit = async () => {
    if (!report) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/work-reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'ส่งรายงานไม่สำเร็จ')
      setReport(json.data)
      toast.success('ส่งรายงานเพื่ออนุมัติเรียบร้อย')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-24 text-gray-400">
        <p className="text-4xl mb-3">😕</p>
        <p>ไม่พบรายงาน</p>
        <Link href="/work-reports" className="text-sky-600 hover:underline text-sm mt-2 inline-block">
          กลับหน้ารายการ
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/work-reports"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6" style={{ color: '#2BA8D4' }} />
              รายงานผลงาน
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={report.status} />
              <span className="text-xs text-gray-400">{formatDate(report.report_date)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canSubmit && (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="text-white gap-1.5"
              style={{ backgroundColor: '#2BA8D4' }}
            >
              {submitting ? 'กำลังส่ง...' : '📤 ส่งเพื่ออนุมัติ'}
            </Button>
          )}
          {canApprove && (
            <Button
              onClick={() => setApproveOpen(true)}
              className="gap-1.5 bg-green-600 hover:bg-green-700 text-white"
            >
              ✅ อนุมัติ / ปฏิเสธ
            </Button>
          )}
        </div>
      </div>

      {/* Report info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2">
          ข้อมูลทั่วไป
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4 text-sky-500" />
            <span className="font-medium">วันที่:</span>
            <span>{formatDate(report.report_date)}</span>
          </div>
          {report.team && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4 text-sky-500" />
              <span className="font-medium">ทีม:</span>
              <span>{report.team.name}</span>
            </div>
          )}
          {report.department && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-medium">แผนก:</span>
              <span>{report.department.name}</span>
            </div>
          )}
          {report.creator && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4 text-sky-500" />
              <span className="font-medium">สร้างโดย:</span>
              <span>{report.creator.full_name}</span>
            </div>
          )}
        </div>

        {report.notes && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-gray-500 text-xs mb-1">หมายเหตุ</p>
            <p>{report.notes}</p>
          </div>
        )}

        {/* Approval info */}
        {report.status === 'approved' && report.approver && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-4 py-3">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              อนุมัติโดย <strong>{report.approver.full_name}</strong>
              {report.approved_at && ` เมื่อ ${formatDateTime(report.approved_at)}`}
            </span>
          </div>
        )}

        {report.status === 'rejected' && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">รายงานถูกปฏิเสธ</p>
              {report.notes && <p className="text-xs mt-0.5">{report.notes}</p>}
            </div>
          </div>
        )}

        {report.status === 'submitted' && (
          <div className="flex items-center gap-2 text-sm text-sky-600 bg-sky-50 rounded-lg px-4 py-3">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span>
              รายงานถูกส่งแล้ว{report.submitted_at && ` เมื่อ ${formatDateTime(report.submitted_at)}`}
              {' '}กำลังรออนุมัติ
            </span>
          </div>
        )}
      </div>

      {/* Items table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2 mb-4">
          รายการผลงาน ({report.items?.length ?? 0} รายการ)
        </h2>
        {!report.items || report.items.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">ยังไม่มีรายการผลงาน</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-xs text-gray-500">
                  <th className="py-2 px-3 text-left w-8">#</th>
                  <th className="py-2 px-3 text-left">พนักงาน</th>
                  <th className="py-2 px-3 text-left">ประเภทงาน</th>
                  <th className="py-2 px-3 text-right">จำนวน</th>
                  <th className="py-2 px-3 text-left">หน่วย</th>
                  <th className="py-2 px-3 text-right">ชม.</th>
                  <th className="py-2 px-3 text-right">
                    <span className="text-green-600">ดี</span>
                  </th>
                  <th className="py-2 px-3 text-right">
                    <span className="text-red-500">เสีย</span>
                  </th>
                  <th className="py-2 px-3 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-xs text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          {item.worker?.full_name ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-700">
                      {item.work_type?.name ?? '-'}
                      {item.work_type?.code && (
                        <span className="text-xs text-gray-400 ml-1">({item.work_type.code})</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-gray-900">
                      <div className="flex items-center justify-end gap-1">
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                        {item.quantity.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-xs">
                      {item.unit?.symbol ?? item.unit?.name ?? '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-600">
                      {item.hours_worked != null ? (
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {item.hours_worked}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right text-green-600 font-medium">
                      {item.good_quantity != null ? item.good_quantity.toLocaleString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-red-500 font-medium">
                      {item.reject_quantity != null ? item.reject_quantity.toLocaleString() : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">{item.note ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approval history */}
      {report.approvals && report.approvals.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-2 mb-4">
            ประวัติการอนุมัติ
          </h2>
          <div className="space-y-3">
            {report.approvals.map((approval) => (
              <div
                key={approval.id}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  approval.action === 'approved'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {approval.action === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {approval.action === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'} โดย{' '}
                    {approval.actor?.full_name ?? 'ไม่ทราบ'}{' '}
                    <span className="font-normal text-xs opacity-70">({approval.action_role})</span>
                  </p>
                  {approval.reason && (
                    <p className="text-xs mt-0.5 opacity-80">{approval.reason}</p>
                  )}
                  <p className="text-xs mt-0.5 opacity-60">{formatDateTime(approval.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <ApproveDialog
        open={approveOpen}
        report={report}
        onClose={() => setApproveOpen(false)}
        onDone={(updated) => {
          setReport({ ...report, ...updated })
          setApproveOpen(false)
        }}
      />
    </div>
  )
}
