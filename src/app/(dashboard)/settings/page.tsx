import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่า</h1>
        <p className="text-sm text-gray-500 mt-1">จัดการการตั้งค่าระบบและบัญชีผู้ใช้</p>
      </div>

      <Card className="border-0 shadow-sm max-w-lg">
        <CardHeader>
          <CardTitle className="text-base">ข้อมูลบริษัท</CardTitle>
          <CardDescription>อัปเดตข้อมูลบริษัทของคุณ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>ชื่อบริษัท</Label>
            <Input defaultValue="นราทองพลัส" />
          </div>
          <div className="space-y-2">
            <Label>อีเมลติดต่อ</Label>
            <Input defaultValue="contact@narathongplus.com" type="email" />
          </div>
          <div className="space-y-2">
            <Label>เบอร์โทรศัพท์</Label>
            <Input defaultValue="+66 XX XXX XXXX" type="tel" />
          </div>
          <Button
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white"
          >
            บันทึกการเปลี่ยนแปลง
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
