'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { WorkReportForm } from '@/components/work-report/WorkReportForm'
import type { WorkReport } from '@/types/work-report'

interface EditWorkReportPageProps {
  params: Promise<{ id: string }>
}

export default function EditWorkReportPage({ params }: EditWorkReportPageProps) {
  const { id } = use(params)
  const [report, setReport] = useState<WorkReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/work-reports/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
        // Only draft reports can be edited
        if (json.data?.status !== 'draft') {
          toast.error('รายงานนี้ไม่สามารถแก้ไขได้ (ไม่ใช่ฉบับร่าง)')
        }
        setReport(json.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [id])

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
      <div className="flex items-center gap-3">
        <Link
          href={`/work-reports/${id}`}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6" style={{ color: '#2BA8D4' }} />
            แก้ไขรายงานผลงาน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">แก้ไขข้อมูลรายงานฉบับร่าง</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <WorkReportForm report={report} />
      </div>
    </div>
  )
}
