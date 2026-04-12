'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CRMProject, CRMStage, STAGE_CONFIG } from '@/types/crm'
import { ProjectCard } from './ProjectCard'

interface KanbanColumnProps {
  stage: CRMStage
  projects: CRMProject[]
  onAddProject: (stage: CRMStage) => void
  onProjectClick: (project: CRMProject) => void
}

function formatCurrencyCompact(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toLocaleString('th-TH')
}

export function KanbanColumn({ stage, projects, onAddProject, onProjectClick }: KanbanColumnProps) {
  const config = STAGE_CONFIG[stage]
  const totalValue = projects.reduce((sum, p) => sum + (p.value || 0), 0)

  return (
    <div className="flex flex-col w-64 flex-shrink-0 h-full">
      {/* Column Header */}
      <div
        className={`rounded-t-lg px-3 py-2.5 border-b-2 ${config.bgColor} ${config.borderColor}`}
      >
        <div className="flex items-center justify-between">
          <h3 className={`text-sm font-bold ${config.textColor}`}>{config.label}</h3>
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${config.bgColor} ${config.textColor} border ${config.borderColor}`}
          >
            {projects.length}
          </div>
        </div>
        {totalValue > 0 && (
          <p className={`text-xs mt-0.5 ${config.textColor} opacity-80`}>
            ฿{formatCurrencyCompact(totalValue)}
          </p>
        )}
      </div>

      {/* Column Body */}
      <div className="flex-1 bg-gray-50 rounded-b-lg p-2 min-h-[200px] space-y-2 overflow-y-auto">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onProjectClick(project)}
          />
        ))}

        {/* Add Button */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-gray-400 hover:text-sky-700 hover:bg-sky-50 border border-dashed border-gray-300 hover:border-sky-300 gap-1 mt-1"
          onClick={() => onAddProject(stage)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="text-xs">เพิ่ม</span>
        </Button>
      </div>
    </div>
  )
}
