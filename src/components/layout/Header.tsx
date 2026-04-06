'use client'

import { Bell, Menu, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  onMenuToggle?: () => void
  userEmail?: string
  pageTitle?: string
}

export function Header({
  onMenuToggle,
  userEmail = 'user@example.com',
  pageTitle = 'Dashboard',
}: HeaderProps) {
  const initials = userEmail.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-4 shadow-sm">
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden p-2"
        onClick={onMenuToggle}
      >
        <Menu className="w-5 h-5 text-gray-500" />
      </Button>

      {/* Page Title */}
      <h2 className="font-semibold text-gray-800 hidden sm:block">{pageTitle}</h2>

      {/* Search */}
      <div className="flex-1 max-w-sm ml-4 hidden md:flex items-center gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="search"
            placeholder="ค้นหา..."
            className="pl-9 h-9 text-sm bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="focus:outline-none">
            <Avatar className="w-8 h-8 cursor-pointer">
              <AvatarFallback
                className="text-xs text-white font-semibold"
                style={{ backgroundColor: '#7B4F2E' }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs text-gray-500 font-normal">
              {userEmail}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>โปรไฟล์</DropdownMenuItem>
            <DropdownMenuItem>ตั้งค่า</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">ออกจากระบบ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
