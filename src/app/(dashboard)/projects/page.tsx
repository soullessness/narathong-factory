import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, FolderKanban } from 'lucide-react'

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">โปรเจค</h1>
          <p className="text-sm text-gray-500 mt-1">จัดการโปรเจคทั้งหมดของโรงงาน</p>
        </div>
        <Button style={{ backgroundColor: '#7B4F2E' }} className="text-white gap-2">
          <Plus className="w-4 h-4" />
          เพิ่มโปรเจค
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <FolderKanban className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">ยังไม่มีโปรเจค</p>
          <p className="text-sm text-gray-400 mt-1">กดปุ่ม "เพิ่มโปรเจค" เพื่อเริ่มต้น</p>
        </CardContent>
      </Card>
    </div>
  )
}
