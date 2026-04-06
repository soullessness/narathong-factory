import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ลูกค้า (CRM)</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการข้อมูลลูกค้าและการติดต่อ</p>
        </div>
        <Button style={{ backgroundColor: '#7B4F2E' }} className="text-white gap-2">
          <Plus className="w-4 h-4" />
          เพิ่มลูกค้า
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มีข้อมูลลูกค้า</p>
          <p className="text-sm text-gray-400 mt-1">กดปุ่ม "เพิ่มลูกค้า" เพื่อเริ่มต้น</p>
        </CardContent>
      </Card>
    </div>
  )
}
