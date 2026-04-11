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
import { UserDialog, ROLE_LABELS } from '@/components/settings/UserDialog'
import { DeleteUserDialog } from '@/components/settings/DeleteUserDialog'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'

interface UserRow {
  id: string
  email: string
  full_name: string
  role: string
  department_id: string | null
  department?: { id: string; name: string } | null
  phone: string | null
  is_active: boolean
  created_at: string
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h1>
          <p className="text-sm text-gray-500 mt-1">บัญชีผู้ใช้ทั้งหมดในระบบ</p>
        </div>
        {isAdmin && (
          <Button
            onClick={handleAddNew}
            style={{ backgroundColor: '#7B4F2E' }}
            className="text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มผู้ใช้
          </Button>
        )}
      </div>

      {/* Filters */}
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

      {/* Table — Desktop */}
      <div className="hidden md:block">
        <Card className="border-0 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>แผนก</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-400">
                    กำลังโหลด...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-gray-400">
                    ไม่พบผู้ใช้
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {u.full_name || '-'}
                      {u.id === currentUserId && (
                        <span className="ml-1 text-xs text-gray-400">(คุณ)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="text-amber-800 bg-amber-100 border-0"
                      >
                        {ROLE_LABELS[u.role] ?? u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {u.department?.name ?? '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.is_active ? 'default' : 'secondary'}
                        className={
                          u.is_active
                            ? 'bg-green-100 text-green-800 border-0'
                            : 'bg-gray-100 text-gray-500 border-0'
                        }
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(u.created_at)}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-500 hover:text-amber-700"
                            onClick={() => handleEdit(u)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {u.id !== currentUserId && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-red-600"
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

      {/* Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <p className="text-center text-gray-400 py-8">กำลังโหลด...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-400 py-8">ไม่พบผู้ใช้</p>
        ) : (
          filteredUsers.map((u) => (
            <Card key={u.id} className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {u.full_name || '-'}
                      {u.id === currentUserId && (
                        <span className="ml-1 text-xs text-gray-400">(คุณ)</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                  <Badge
                    variant={u.is_active ? 'default' : 'secondary'}
                    className={
                      u.is_active
                        ? 'bg-green-100 text-green-800 border-0 text-xs'
                        : 'bg-gray-100 text-gray-500 border-0 text-xs'
                    }
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-amber-800 bg-amber-100 border-0 text-xs">
                    {ROLE_LABELS[u.role] ?? u.role}
                  </Badge>
                  {u.department?.name && (
                    <span className="text-xs text-gray-500">{u.department.name}</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(u.created_at)}</span>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-500 hover:text-amber-700"
                        onClick={() => handleEdit(u)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {u.id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-600"
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

      {/* Dialogs */}
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
