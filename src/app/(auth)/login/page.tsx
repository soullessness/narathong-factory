'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  /* Narathong Plus brand colors */
  const PRIMARY = '#2BA8D4'
  const PRIMARY_DARK = '#1E8AB0'

  return (
    <div className="w-full max-w-md px-4">
      {/* Logo & Brand */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-28 h-28 mb-4">
          <Image
            src="/narathong-icon.jpg"
            alt="Narathong Plus Icon"
            width={112}
            height={112}
            className="object-contain rounded-2xl shadow-lg"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold" style={{ color: PRIMARY }}>
          โรงงานนราทองพลัส
        </h1>
        <p className="text-sm mt-1 text-gray-500">
          ระบบบริหารจัดการโรงงาน
        </p>
      </div>

      {/* Login Card */}
      <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl font-semibold text-gray-800">
            เข้าสู่ระบบ
          </CardTitle>
          <CardDescription className="text-gray-500">
            กรุณากรอกอีเมลและรหัสผ่านของคุณ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">
                อีเมล
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-200 focus:border-sky-400 focus:ring-sky-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">
                รหัสผ่าน
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-200 focus:border-sky-400 focus:ring-sky-400"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-all duration-200 hover:opacity-90"
              style={{ backgroundColor: PRIMARY }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                'เข้าสู่ระบบ'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              ติดต่อผู้ดูแลระบบหากมีปัญหาในการเข้าสู่ระบบ
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs mt-6" style={{ color: `${PRIMARY}99` }}>
        © 2025 นราทองพลัส. สงวนลิขสิทธิ์.
      </p>
    </div>
  )
}
