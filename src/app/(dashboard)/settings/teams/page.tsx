'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TeamDialog } from '@/components/settings/TeamDialog'
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Building2,
  UserCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Team } from '@/types/team'

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)

  const canManage = ['admin', 'factory_manager'].includes(userRole)
  const isAdmin = userRole === 'admin'

  // Load current user role
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
          .then(({ data }) => setUserRole(data?.role ?? ''))
      }
    })
  }, [])

  const fetchTeams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teams')
      const json = await res.json()
      if (res.ok) setTeams(json.data ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTeams()
  }, [fetchTeams])

  function handleEdit(team: Team) {
    setEditingTeam(team)
    setDialogOpen(true)
  }

  function handleAddNew() {
    setEditingTeam(null)
    setDialogOpen(true)
  }

  async function handleDelete(team: Team) {
    if (!confirm(`ยืนยันลบทีม "${team.name}"?\nการลบจะไม่สามารถกู้คืนได้`)) return
    try {
      const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'ลบทีมไม่สำเร็จ')
        return
      }
      toast.success(`ลบทีม "${team.name}" สำเร็จ`)
      fetchTeams()
    } catch {
      toast.error('เกิดข้อผิดพลาด')
    }
  }

  // Group teams by department
  const teamsByDepartment = teams.reduce<Record<string, { deptName: string; teams: Team[] }>>(
    (acc, team) => {
      const deptId = team.department_id
      const deptName = team.department?.name ?? 'ไม่ระบุแผนก'
      if (!acc[deptId]) acc[deptId] = { deptName, teams: [] }
      acc[deptId].teams.push(team)
      return acc
    },
    {}
  )

  const totalTeams = teams.length
  const activeTeams = teams.filter((t) => t.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
            style={{ backgroundColor: '#F5EDE6' }}
          >
            <Users className="h-6 w-6" style={{ color: '#2BA8D4' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการทีม</h1>
            <p className="text-sm text-gray-500 mt-0.5">ทีมงานทั้งหมดในโรงงาน</p>
          </div>
        </div>
        {canManage && (
          <Button
            onClick={handleAddNew}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white gap-2 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            สร้างทีมใหม่
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50">
                <Users className="h-4 w-4 text-sky-700" />
              </div>
              <div>
                <p className="text-xs text-gray-500">ทีมทั้งหมด</p>
                <p className="text-xl font-bold text-gray-900">{totalTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-xl font-bold text-gray-900">{activeTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                <XCircle className="h-4 w-4 text-gray-400" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Inactive</p>
                <p className="text-xl font-bold text-gray-900">{totalTeams - activeTeams}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teams grouped by department */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, j) => (
                  <Card key={j} className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Users className="h-8 w-8 text-gray-300" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-500">ยังไม่มีทีม</p>
            <p className="text-sm mt-1">กด &quot;+ สร้างทีมใหม่&quot; เพื่อเริ่มต้น</p>
          </div>
          {canManage && (
            <Button
              onClick={handleAddNew}
              size="sm"
              style={{ backgroundColor: '#2BA8D4' }}
              className="text-white gap-2 mt-1"
            >
              <Plus className="h-3.5 w-3.5" />
              สร้างทีมใหม่
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(teamsByDepartment).map(([, { deptName, teams: deptTeams }]) => (
            <div key={deptName} className="space-y-3">
              {/* Department Header */}
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" style={{ color: '#2BA8D4' }} />
                <h2 className="text-sm font-semibold text-gray-700">{deptName}</h2>
                <span className="text-xs text-gray-400">({deptTeams.length} ทีม)</span>
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {deptTeams.map((team) => (
                  <Card
                    key={team.id}
                    className="border-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-lg shrink-0 text-white text-sm font-bold"
                            style={{ backgroundColor: '#2BA8D4' }}
                          >
                            {team.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {team.name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{deptName}</p>
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`border-0 text-xs shrink-0 ${
                            team.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {team.is_active ? '● Active' : '○ Inactive'}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 mb-3">
                        {team.lead?.full_name && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <UserCheck className="h-3 w-3 text-sky-600 shrink-0" />
                            <span className="truncate">{team.lead.full_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Users className="h-3 w-3 text-blue-500 shrink-0" />
                          <span>{team.member_count ?? 0} สมาชิก</span>
                        </div>
                        {team.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                            {team.description}
                          </p>
                        )}
                      </div>

                      {canManage && (
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-sky-700 hover:bg-sky-50"
                            onClick={() => handleEdit(team)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDelete(team)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TeamDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        team={editingTeam}
        onSuccess={fetchTeams}
      />
    </div>
  )
}
