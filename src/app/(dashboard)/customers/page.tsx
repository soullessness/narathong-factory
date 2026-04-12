'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, Users, ShieldOff } from 'lucide-react'
import { Customer, CUSTOMER_TYPE_LABELS } from '@/types/crm'
import { AddCustomerDialog } from '@/components/crm/AddCustomerDialog'
import { useUserRole } from '@/hooks/useUserRole'
import { canAccess } from '@/lib/permissions'

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return '-'
  }
}

const typeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  retail: 'secondary',
  contractor: 'default',
  developer: 'outline',
}

export default function CustomersPage() {
  const router = useRouter()
  const { role, loading: roleLoading } = useUserRole()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/customers')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'โหลดข้อมูลไม่สำเร็จ')
        return
      }
      setCustomers(json.data || [])
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const handleCustomerCreated = (customer: Customer) => {
    setCustomers((prev) => [...prev, customer].sort((a, b) => a.name.localeCompare(b.name, 'th')))
  }

  const handleRowClick = (customerId: string) => {
    router.push(`/projects?customer=${customerId}`)
  }

  if (!roleLoading && role !== null && !canAccess(role, 'customers')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <ShieldOff className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-gray-400 mt-1">คุณไม่มีสิทธิ์ดูหน้านี้</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/worker-logs')}>
          ไปหน้าบันทึกงาน
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>
          <p className="text-sm text-gray-500 mt-1">
            ลูกค้าทั้งหมด {customers.length} ราย
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button
            onClick={() => setShowAdd(true)}
            style={{ backgroundColor: '#7B4F2E' }}
            className="text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มลูกค้า
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && customers.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลลูกค้า</p>
          <p className="text-sm text-gray-400 mt-1">กดปุ่ม &quot;เพิ่มลูกค้า&quot; เพื่อเริ่มต้น</p>
        </div>
      )}

      {/* Customer Table */}
      {!loading && customers.length > 0 && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ผู้ติดต่อ</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">เบอร์โทร</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ประเภท</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">จำนวนโปรเจค</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">วันที่เพิ่ม</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer, idx) => (
                    <tr
                      key={customer.id}
                      className={`border-b border-gray-50 hover:bg-amber-50 transition-colors cursor-pointer ${
                        idx % 2 === 0 ? '' : 'bg-gray-50/30'
                      }`}
                      onClick={() => handleRowClick(customer.id)}
                      title="คลิกเพื่อดูโปรเจคของลูกค้านี้"
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <div>
                          <span>{customer.name}</span>
                          {customer.email && (
                            <p className="text-xs text-gray-400 mt-0.5">{customer.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {customer.contact_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {customer.phone || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant={typeVariant[customer.customer_type] ?? 'secondary'} className="text-xs">
                          {CUSTOMER_TYPE_LABELS[customer.customer_type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          {/* จำนวนโปรเจคโหลดจาก client ไม่ได้เพราะ API ไม่มี join — แสดง - */}
                          -
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {formatDate(customer.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={handleCustomerCreated}
      />
    </div>
  )
}
