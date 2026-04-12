'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings, ShieldOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role ?? null)
      }
      setLoading(false)
    }
    fetchRole()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        กำลังโหลด...
      </div>
    )
  }

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
        <ShieldOff className="w-12 h-12 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-sm">เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเข้าถึงหน้านี้ได้</p>
      </div>
    )
  }

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
