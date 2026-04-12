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
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

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
    href: '/price-requests',
    label: 'ขอราคาสินค้า',
    icon: ClipboardList,
    badgeKey: 'priceRequests',
    priceRequestMenu: true,
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
    href: '/worker-logs',
    label: 'บันทึกงาน',
    icon: ClipboardList,
    badgeKey: 'workerLogs',
    workerMenu: true,
  },
  {
    href: '/settings',
    label: 'ตั้งค่า',
    icon: Settings,
    adminOnly: false,
    subItems: [
      { href: '/settings/users', label: 'จัดการผู้ใช้', adminOnly: true },
      { href: '/settings/teams', label: 'จัดการทีม', adminOnly: false, managerOnly: true },
    ],
  },
]

interface SidebarProps {
  userEmail?: string
  userRole?: string
}

export function Sidebar({ userEmail = 'user@example.com', userRole = 'admin' }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendingCount, setPendingCount] = useState(0)

  const canRespondPrice = ['admin', 'factory_manager', 'team_lead'].includes(userRole)
  const canApproveWorkerLogs = ['admin', 'factory_manager', 'team_lead'].includes(userRole)
  const showWorkerMenu = ['worker', 'team_lead', 'factory_manager', 'executive', 'admin'].includes(userRole)
  const showPriceRequestMenu = ['admin', 'executive', 'factory_manager', 'accounting'].includes(userRole)
  const [workerLogPendingCount, setWorkerLogPendingCount] = useState(0)

  // Load pending price requests count for users who can respond to price requests
  useEffect(() => {
    if (!canRespondPrice) return
    const load = async () => {
      try {
        const res = await fetch('/api/price-requests')
        const json = await res.json()
        const data = json.data ?? []
        const count = data.filter(
          (r: { status: string }) => r.status === 'pending' || r.status === 'reviewing'
        ).length
        setPendingCount(count)
      } catch {
        // ignore
      }
    }
    load()
  }, [canRespondPrice])

  // Load pending worker logs count for approvers
  useEffect(() => {
    if (!canApproveWorkerLogs) return
    const load = async () => {
      try {
        const res = await fetch('/api/worker-logs?status=pending')
        const json = await res.json()
        setWorkerLogPendingCount((json.data ?? []).length)
      } catch {
        // ignore
      }
    }
    load()
  }, [canApproveWorkerLogs])

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
    executive: 'ผู้บริหาร',
    factory_manager: 'ผู้จัดการโรงงาน',
    team_lead: 'หัวหน้าทีม',
    worker: 'พนักงานโรงงาน',
    sales: 'พนักงานขาย',
    accounting: 'บัญชี',
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
          // Hide worker-logs menu for roles that shouldn't see it
          if (item.workerMenu && !showWorkerMenu) return null
          // Hide price-requests menu for roles that don't have access
          if (item.priceRequestMenu && !showPriceRequestMenu) return null
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const badgeCount =
            item.badgeKey === 'priceRequests' && canRespondPrice
              ? pendingCount
              : item.badgeKey === 'workerLogs' && canApproveWorkerLogs
              ? workerLogPendingCount
              : 0
          const showBadge = badgeCount > 0
          const visibleSubItems = (item.subItems ?? []).filter((sub) => {
            if (sub.adminOnly && userRole !== 'admin') return false
            if (sub.managerOnly && !['admin', 'factory_manager'].includes(userRole)) return false
            return true
          })
          return (
            <div key={item.href}>
              <Link
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
                {showBadge && (
                  <span className={cn(
                    'text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-amber-100 text-amber-700'
                  )}>
                    {badgeCount}
                  </span>
                )}
                {isActive && !showBadge && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/60" />
                )}
              </Link>
              {/* Sub-menu items */}
              {visibleSubItems.length > 0 && isActive && (
                <div className="mt-1 ml-4 space-y-0.5 border-l-2 border-amber-200 pl-3">
                  {visibleSubItems.map((sub) => {
                    const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/')
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150',
                          isSubActive
                            ? 'font-medium text-amber-800 bg-amber-100'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-amber-50'
                        )}
                      >
                        <span>{sub.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
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
