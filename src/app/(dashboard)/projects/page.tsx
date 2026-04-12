'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, RefreshCw, LayoutGrid, List, ShieldOff } from 'lucide-react'
import { CRMProject, CRMStage, CRMStageLog, STAGE_ORDER, STAGE_CONFIG } from '@/types/crm'
import { KanbanColumn } from '@/components/crm/KanbanColumn'
import { ProjectDialog } from '@/components/crm/ProjectDialog'
import { ProjectDetailDialog } from '@/components/crm/ProjectDetailDialog'
import { useUserRole } from '@/hooks/useUserRole'
import { canAccess } from '@/lib/permissions'

type ViewMode = 'kanban' | 'list'

const STORAGE_KEY = 'projects_view_mode'

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    })
  } catch {
    return '-'
  }
}

function formatValue(val: number | null | undefined): string {
  if (!val) return '-'
  return '฿' + new Intl.NumberFormat('th-TH').format(val)
}

export default function ProjectsPage() {
  const router = useRouter()
  const { role, loading: roleLoading } = useUserRole()
  const [projects, setProjects] = useState<CRMProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('kanban')

  // Dialogs
  const [showAdd, setShowAdd] = useState(false)
  const [addStage, setAddStage] = useState<CRMStage>('lead')
  const [editProject, setEditProject] = useState<CRMProject | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailProject, setDetailProject] = useState<CRMProject | null>(null)
  const [stageLogs, setStageLogs] = useState<CRMStageLog[]>([])

  // Load view preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null
      if (saved === 'kanban' || saved === 'list') {
        setViewMode(saved)
      }
    }
  }, [])

  const handleSetView = (mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode)
    }
  }

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'โหลดข้อมูลไม่สำเร็จ')
        return
      }
      setProjects(json.data || [])
    } catch {
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const fetchStageLogs = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/stage`)
      if (res.ok) {
        const json = await res.json()
        setStageLogs(json.data || [])
      }
    } catch {
      setStageLogs([])
    }
  }

  const handleAddProject = (stage: CRMStage) => {
    setAddStage(stage)
    setEditProject(null)
    setShowAdd(true)
  }

  const handleProjectClick = (project: CRMProject) => {
    router.push(`/projects/${project.id}`)
  }

  const handleProjectSaved = (saved: CRMProject) => {
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = saved
        return updated
      }
      return [saved, ...prev]
    })
  }

  const handleStageChanged = (updated: CRMProject) => {
    setDetailProject(updated)
    handleProjectSaved(updated)
  }

  const handleEditFromDetail = () => {
    if (!detailProject) return
    setEditProject(detailProject)
    setShowDetail(false)
    setShowAdd(true)
  }

  const projectsByStage = STAGE_ORDER.reduce<Record<CRMStage, CRMProject[]>>(
    (acc, stage) => {
      acc[stage] = projects.filter((p) => p.stage === stage)
      return acc
    },
    {} as Record<CRMStage, CRMProject[]>
  )

  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0)
  const activeCount = projects.filter(
    (p) => p.stage !== 'completed' && p.stage !== 'cancelled'
  ).length

  if (!roleLoading && role !== null && !canAccess(role, 'projects')) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <ShieldOff className="w-12 h-12 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-600">ไม่มีสิทธิ์เข้าถึง</h2>
        <p className="text-sm text-gray-400 mt-1">คุณไม่มีสิทธิ์ดูหน้านี้</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/worker-logs')}>
          ไปหน้าบันทึกงาน
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">โปรเจค</h1>
          <p className="text-sm text-gray-500 mt-1">
            ทั้งหมด {projects.length} รายการ · กำลังดำเนินการ {activeCount} รายการ
            {totalValue > 0 && (
              <>
                {' '}
                · มูลค่ารวม{' '}
                <span className="font-semibold text-green-700">
                  ฿{new Intl.NumberFormat('th-TH').format(totalValue)}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
            <button
              onClick={() => handleSetView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={viewMode === 'kanban' ? { backgroundColor: '#2BA8D4' } : {}}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => handleSetView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              style={viewMode === 'list' ? { backgroundColor: '#2BA8D4' } : {}}
            >
              <List className="w-3.5 h-3.5" />
              รายการ
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchProjects}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button
            onClick={() => handleAddProject('lead')}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            เพิ่มโปรเจค
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      )}

      {/* Kanban View */}
      {!loading && viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1" style={{ minHeight: '0' }}>
          {STAGE_ORDER.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              projects={projectsByStage[stage]}
              onAddProject={handleAddProject}
              onProjectClick={handleProjectClick}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && (
        <div className="flex-1 overflow-auto">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-gray-500 font-medium">ยังไม่มีโปรเจค</p>
              <p className="text-sm text-gray-400 mt-1">กดปุ่ม &quot;เพิ่มโปรเจค&quot; เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">รหัส</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">ชื่อโปรเจค</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">ลูกค้า</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Stage</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">มูลค่า</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">กำหนดส่ง</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Sales</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project, idx) => {
                      const stageConf = STAGE_CONFIG[project.stage]
                      return (
                        <tr
                          key={project.id}
                          className={`border-b border-gray-50 hover:bg-sky-50 transition-colors cursor-pointer ${
                            idx % 2 === 0 ? '' : 'bg-gray-50/30'
                          }`}
                          onClick={() => handleProjectClick(project)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                            {project.project_code || '-'}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 max-w-xs">
                            <span className="line-clamp-2">{project.name}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {project.customers?.name || '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageConf.bgColor} ${stageConf.textColor}`}
                            >
                              {stageConf.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-gray-700 whitespace-nowrap">
                            {formatValue(project.value)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {formatDate(project.deadline)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {project.sales_profile?.full_name || '-'}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-sky-700 hover:text-[#166780] hover:bg-sky-100 h-7 px-2 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleProjectClick(project)
                              }}
                            >
                              ดูรายละเอียด
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Project Dialog */}
      <ProjectDialog
        open={showAdd}
        onClose={() => {
          setShowAdd(false)
          setEditProject(null)
        }}
        onSaved={(saved) => {
          handleProjectSaved(saved)
          setShowAdd(false)
          setEditProject(null)
        }}
        initialStage={addStage}
        editProject={editProject}
      />

      {/* Detail Dialog */}
      <ProjectDetailDialog
        open={showDetail}
        project={detailProject}
        stageLogs={stageLogs}
        onClose={() => setShowDetail(false)}
        onEdit={handleEditFromDetail}
        onStageChanged={handleStageChanged}
      />
    </div>
  )
}
