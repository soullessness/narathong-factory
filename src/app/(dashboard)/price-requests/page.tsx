'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { PriceRequestCard } from '@/components/price-request/PriceRequestCard'
import { PriceRequestDialog } from '@/components/price-request/PriceRequestDialog'
import { PriceResponseDialog } from '@/components/price-request/PriceResponseDialog'
import type { PriceRequest } from '@/types/price-request'
import { createClient } from '@/lib/supabase/client'

type TabValue = 'pending' | 'all'

export default function PriceRequestsPage() {
  const [requests, setRequests] = useState<PriceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<TabValue>('pending')
  const [userRole, setUserRole] = useState<string>('sales')

  // Dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null)
  const [responseOpen, setResponseOpen] = useState(false)

  // Get user role
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserRole(user.user_metadata?.role ?? 'sales')
      }
    })
  }, [])

  const isFactoryOrAdmin = userRole === 'factory_head' || userRole === 'admin'

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/price-requests')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'โหลดข้อมูลไม่สำเร็จ')
      setRequests(json.data ?? [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const pendingRequests = requests.filter((r) => r.status === 'pending' || r.status === 'reviewing')
  const displayRequests = isFactoryOrAdmin && tab === 'pending' ? pendingRequests : requests

  const handleCardClick = (req: PriceRequest) => {
    setSelectedRequest(req)
    if (isFactoryOrAdmin) {
      setResponseOpen(true)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6" style={{ color: '#7B4F2E' }} />
            ขอราคาสินค้า
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isFactoryOrAdmin
              ? 'จัดการคำขอราคาสินค้าจากทีมขาย'
              : 'ส่งคำขอราคาสินค้า Custom ให้โรงงาน'}
          </p>
        </div>
        {!isFactoryOrAdmin && (
          <Button
            size="sm"
            className="text-white gap-1.5"
            style={{ backgroundColor: '#7B4F2E' }}
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            ขอราคาสินค้า Custom
          </Button>
        )}
      </div>

      {/* Tabs (factory/admin only) */}
      {isFactoryOrAdmin && (
        <div className="flex gap-2 border-b border-gray-200 pb-0">
          <button
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('pending')}
          >
            รอดำเนินการ
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
          <button
            className={`pb-2.5 px-1 text-sm font-medium border-b-2 transition-colors ${
              tab === 'all'
                ? 'border-amber-700 text-amber-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('all')}
          >
            ทั้งหมด ({requests.length})
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : displayRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium">
            {isFactoryOrAdmin && tab === 'pending'
              ? 'ไม่มีคำขอที่รอดำเนินการ'
              : 'ยังไม่มีคำขอราคา'}
          </p>
          {!isFactoryOrAdmin && (
            <p className="text-sm mt-1">กดปุ่ม &quot;ขอราคาสินค้า Custom&quot; เพื่อส่งคำขอ</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayRequests.map((req) => (
            <PriceRequestCard
              key={req.id}
              request={req}
              onClick={() => handleCardClick(req)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog (sales/cashier) */}
      <PriceRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={fetchRequests}
      />

      {/* Response Dialog (factory_head/admin) */}
      <PriceResponseDialog
        open={responseOpen}
        request={selectedRequest}
        onClose={() => {
          setResponseOpen(false)
          setSelectedRequest(null)
        }}
        onSaved={fetchRequests}
      />
    </div>
  )
}
