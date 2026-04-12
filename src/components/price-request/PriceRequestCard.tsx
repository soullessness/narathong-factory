'use client'

import { Badge } from '@/components/ui/badge'
import { PriceRequest, PRODUCT_TYPE_LABELS, STATUS_LABELS } from '@/types/price-request'
import { Calendar, Package, User } from 'lucide-react'

interface PriceRequestCardProps {
  request: PriceRequest
  onClick?: () => void
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  quoted: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
}

function formatDate(dateStr?: string) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function PriceRequestCard({ request, onClick }: PriceRequestCardProps) {
  const statusColor = statusColors[request.status] ?? 'bg-gray-100 text-gray-600'

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer hover:border-sky-300"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">{request.product_name}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {PRODUCT_TYPE_LABELS[request.product_type] ?? request.product_type}
          </p>
        </div>
        <Badge className={`text-xs font-medium border shrink-0 ${statusColor}`} variant="outline">
          {STATUS_LABELS[request.status] ?? request.status}
        </Badge>
      </div>

      {/* Spec */}
      {request.spec && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-2 mb-3 line-clamp-2">
          {request.spec}
        </p>
      )}

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <Package className="w-3 h-3" />
          {request.quantity.toLocaleString('th-TH')} {request.unit}
        </span>
        {request.deadline_date && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(request.deadline_date)}
          </span>
        )}
        {request.requester?.full_name && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {request.requester.full_name}
          </span>
        )}
      </div>

      {/* Project / Quotation link */}
      {(request.project?.name || request.quotation?.quotation_number) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {request.project?.name && (
            <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
              📁 {request.project.name}
            </span>
          )}
          {request.quotation?.quotation_number && (
            <span className="text-xs bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full">
              📄 {request.quotation.quotation_number}
            </span>
          )}
        </div>
      )}

      {/* Price response (if quoted) */}
      {request.status === 'quoted' && request.response && (
        <div className="mt-3 pt-3 border-t border-green-100 bg-green-50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-green-700">💰 ราคาจากโรงงาน</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {request.response.unit_price.toLocaleString('th-TH')} บาท/{request.unit}
            </span>
            <span className="text-base font-bold text-green-700">
              รวม {request.response.total_price.toLocaleString('th-TH')} บาท
            </span>
          </div>
          {request.response.production_days && (
            <p className="text-xs text-gray-500">
              ⏱ ผลิต {request.response.production_days} วัน
            </p>
          )}
          {request.response.notes && (
            <p className="text-xs text-gray-500 line-clamp-2">{request.response.notes}</p>
          )}
        </div>
      )}

      {/* Rejected note */}
      {request.status === 'rejected' && (
        <div className="mt-3 pt-3 border-t border-red-100 bg-red-50 rounded-lg p-2">
          <p className="text-xs text-red-600">❌ คำขอนี้ถูกปฏิเสธ</p>
          {request.response?.notes && (
            <p className="text-xs text-gray-500 mt-1">{request.response.notes}</p>
          )}
        </div>
      )}

      {/* Timestamp */}
      <p className="text-xs text-gray-400 mt-3">
        {formatDate(request.created_at)}
      </p>
    </div>
  )
}
