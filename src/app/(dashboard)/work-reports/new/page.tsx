'use client'

import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { WorkReportForm } from '@/components/work-report/WorkReportForm'

export default function NewWorkReportPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
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
            สร้างรายงานผลงาน
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">กรอกข้อมูลผลงานประจำวัน</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <WorkReportForm />
      </div>
    </div>
  )
}
