'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Factory,
  Settings,
  LogOut,
  ChevronRight,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/projects',
    label: 'โปรเจค',
    icon: FolderKanban,
  },
  {
    href: '/customers',
    label: 'ลูกค้า',
    icon: Users,
  },
  {
    href: '/products',
    label: 'สินค้า',
    icon: Package,
  },
  {
    href: '/production',
    label: 'การผลิต',
    icon: Factory,
  },
  {
    href: '/settings',
    label: 'ตั้งค่า',
    icon: Settings,
  },
]

interface SidebarProps {
  userEmail?: string
  userRole?: string
}

export function Sidebar({ userEmail = 'user@example.com', userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail
    .split('@')[0]
    .slice(0, 2)
    .toUpperCase()

  const roleLabel: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ',
    manager: 'ผู้จัดการ',
    operator: 'พนักงาน',
    viewer: 'ผู้ชม',
  }

  return (
    <aside className="flex flex-col w-64 h-full bg-white border-r border-gray-100 shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg"
          style={{ backgroundColor: '#7B4F2E' }}
        >
          <Factory className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: '#7B4F2E' }}>
            นราทองพลัส
          </p>
          <p className="text-xs text-gray-400">Factory Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-amber-50'
              )}
              style={isActive ? { backgroundColor: '#7B4F2E' } : {}}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-colors',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-amber-700'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-white/60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-50">
          <Avatar className="w-8 h-8">
            <AvatarFallback
              className="text-xs text-white font-semibold"
              style={{ backgroundColor: '#7B4F2E' }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate">
              {userEmail}
            </p>
            <Badge
              variant="secondary"
              className="text-xs mt-0.5 px-1.5 py-0 h-4 text-amber-800 bg-amber-100 border-0"
            >
              {roleLabel[userRole] ?? userRole}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-gray-500 hover:text-red-600 hover:bg-red-50 justify-start gap-2"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          ออกจากระบบ
        </Button>
      </div>
    </aside>
  )
}
