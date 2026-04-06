import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Factory } from 'lucide-react'

export default function ProductionPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">การผลิต</h1>
          <p className="text-sm text-gray-500 mt-1">ติดตามและจัดการออเดอร์การผลิต</p>
        </div>
        <Button style={{ backgroundColor: '#7B4F2E' }} className="text-white gap-2">
          <Plus className="w-4 h-4" />
          สร้างออเดอร์
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Factory className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มีออเดอร์การผลิต</p>
          <p className="text-sm text-gray-400 mt-1">กดปุ่ม "สร้างออเดอร์" เพื่อเริ่มต้น</p>
        </CardContent>
      </Card>
    </div>
  )
}
