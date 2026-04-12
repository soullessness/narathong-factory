'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { UserDialog, ROLE_LABELS } from '@/components/settings/UserDialog'
import { DeleteUserDialog } from '@/components/settings/DeleteUserDialog'
import { Plus, Pencil, Trash2, Search, Users, UserCheck, UserX } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface UserRow {
  id: string
  email: string
  full_name: string
  role: string
  department_id: string | null
  team_id?: string | null
  department?: { id: string; name: string } | null
  phone: string | null
  is_active: boolean
  created_at: string
}

// สีของแต่ละ Role
const ROLE_BADGE_STYLES: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  executive: 'bg-purple-100 text-purple-700',
  factory_manager: 'bg-blue-100 text-blue-700',
  team_lead: 'bg-sky-100 text-sky-700',
  worker: 'bg-gray-100 text-gray-600',
  sales: 'bg-green-100 text-green-700',
  accounting: 'bg-orange-100 text-orange-700',
}

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_BADGE_STYLES[role] ?? 'bg-gray-100 text-gray-600'
  return (
    <Badge variant="secondary" className={`border-0 text-xs font-medium ${style}`}>
      {ROLE_LABELS[role] ?? role}
    </Badge>
  )
}

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = name?.trim()?.[0]?.toUpperCase() ?? '?'
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm'
  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full font-semibold shrink-0`}
      style={{ backgroundColor: '#F5EDE6', color: '#2BA8D4' }}
    >
      {initial}
    </div>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(cols)].map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserRow | null>(null)

  const fetchCurrentUser = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      setCurrentUserRole(profile?.role ?? '')
    }
  }, [])

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const json = await res.json()
      if (res.ok) setUsers(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCurrentUser()
    fetchUsers()
  }, [fetchCurrentUser, fetchUsers])

  const isAdmin = currentUserRole === 'admin'

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  // Stats
  const totalUsers = users.length
  const activeUsers = users.filter((u) => u.is_active).length
  const inactiveUsers = totalUsers - activeUsers
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {})

  function handleEdit(user: UserRow) {
    setEditingUser(user)
    setDialogOpen(true)
  }

  function handleDelete(user: UserRow) {
    setDeletingUser(user)
    setDeleteDialogOpen(true)
  }

  function handleAddNew() {
    setEditingUser(null)
    setDialogOpen(true)
  }

  function formatDate(dateStr: string) {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: th })
    } catch {
      return '-'
    }
  }

  const colSpan = isAdmin ? 7 : 6

  return (
    <div className="space-y-6">

      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: '#F5EDE6' }}
          >
            <Users className="h-6 w-6" style={{ color: '#2BA8D4' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
            <p className="text-sm text-gray-500 mt-0.5">บัญชีผู้ใช้ทั้งหมดในระบบ narathong-factory</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={handleAddNew}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้ใช้
          </Button>
        )}
      </div>

      {/* ─── Stats Bar ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ผู้ใช้ทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">{totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <UserX className="h-4 w-4 text-gray-500" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{inactiveUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex flex-wrap gap-1.5">
            {Object.entries(roleCounts).slice(0, 4).map(([r, count]) => (
              <span
                key={r}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_BADGE_STYLES[r] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {ROLE_LABELS[r] ?? r}
                <span className="font-bold">{count}</span>
              </span>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Filters ─── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="ค้นหาชื่อ หรืออีเมล..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterRole} onValueChange={(v) => setFilterRole(v ?? 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="กรอง Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุก Role</SelectItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ─── Table Desktop ─── */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-600">ชื่อ</TableHead>
                <TableHead className="font-semibold text-gray-600">อีเมล</TableHead>
                <TableHead className="font-semibold text-gray-600">Role</TableHead>
                <TableHead className="font-semibold text-gray-600">แผนก</TableHead>
                <TableHead className="font-semibold text-gray-600">สถานะ</TableHead>
                <TableHead className="font-semibold text-gray-600">วันที่สร้าง</TableHead>
                {isAdmin && <TableHead className="text-right font-semibold text-gray-600">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton cols={colSpan} />
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="py-16">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-8 w-8 text-gray-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-500">ไม่พบผู้ใช้</p>
                        <p className="text-sm mt-1">
                          {search || filterRole !== 'all'
                            ? 'ลองปรับคำค้นหาหรือตัวกรอง'
                            : 'ยังไม่มีผู้ใช้ในระบบ กด "เพิ่มผู้ใช้" เพื่อเริ่มต้น'}
                        </p>
                      </div>
                      {isAdmin && !search && filterRole === 'all' && (
                        <Button
                          onClick={handleAddNew}
                          size="sm"
                          style={{ backgroundColor: '#2BA8D4' }}
                          className="text-white gap-2 mt-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          เพิ่มผู้ใช้คนแรก
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-sky-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.full_name} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.full_name || '-'}
                          </p>
                          {u.id === currentUserId && (
                            <span className="text-[10px] text-sky-600 font-medium">คุณ</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">{u.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {u.department?.name ?? <span className="text-gray-300">—</span>}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs ${
                          u.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {u.is_active ? '● Active' : '○ Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-400 text-sm">
                      {formatDate(u.created_at)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-sky-700 hover:bg-sky-50"
                            onClick={() => handleEdit(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {u.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(u)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* ─── Cards Mobile ─── */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Users className="h-8 w-8 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-500">ไม่พบผู้ใช้</p>
              <p className="text-sm mt-1">
                {search || filterRole !== 'all' ? 'ลองปรับคำค้นหาหรือตัวกรอง' : 'ยังไม่มีผู้ใช้ในระบบ'}
              </p>
            </div>
          </div>
        ) : (
          filteredUsers.map((u) => (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar name={u.full_name} />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {u.full_name || '-'}
                        {u.id === currentUserId && (
                          <span className="ml-1 text-[10px] text-sky-600 font-medium">(คุณ)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`border-0 text-xs shrink-0 ${
                      u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {u.is_active ? '● Active' : '○ Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <RoleBadge role={u.role} />
                  {u.department?.name && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <span className="text-gray-300">•</span>
                      {u.department.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{formatDate(u.created_at)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-sky-700 hover:bg-sky-50"
                        onClick={() => handleEdit(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* ─── Dialogs ─── */}
      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSuccess={fetchUsers}
      />
      {deletingUser && (
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          userId={deletingUser.id}
          userName={deletingUser.full_name}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  )
}
