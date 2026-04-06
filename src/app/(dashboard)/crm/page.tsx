'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw } from 'lucide-react'
import { CRMProject, CRMStage, CRMStageLog, STAGE_ORDER } from '@/types/crm'
import { KanbanColumn } from '@/components/crm/KanbanColumn'
import { ProjectDialog } from '@/components/crm/ProjectDialog'
import { ProjectDetailDialog } from '@/components/crm/ProjectDetailDialog'

export default function CRMPage() {
  const [projects, setProjects] = useState<CRMProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Dialogs
  const [showAdd, setShowAdd] = useState(false)
  const [addStage, setAddStage] = useState<CRMStage>('lead')
  const [editProject, setEditProject] = useState<CRMProject | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailProject, setDetailProject] = useState<CRMProject | null>(null)
  const [stageLogs, setStageLogs] = useState<CRMStageLog[]>([])

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

  const handleProjectClick = async (project: CRMProject) => {
    setDetailProject(project)
    setShowDetail(true)
    await fetchStageLogs(project.id)
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">
            โปรเจคทั้งหมด {projects.length} รายการ · กำลังดำเนินการ {activeCount} รายการ
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
        <div className="flex gap-2">
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
            style={{ backgroundColor: '#7B4F2E' }}
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
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">กำลังโหลด...</p>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      {!loading && (
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
