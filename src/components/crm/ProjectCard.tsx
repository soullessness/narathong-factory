'use client'

import { Calendar, DollarSign, User } from 'lucide-react'
import { format } from 'date-fns'
import { th } from 'date-fns/locale'
import { CRMProject, STAGE_CONFIG } from '@/types/crm'

interface ProjectCardProps {
  project: CRMProject
  onClick: () => void
}

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return ''
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toLocaleString('th-TH')
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return format(new Date(dateStr), 'd MMM', { locale: th })
  } catch {
    return ''
  }
}

function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const config = STAGE_CONFIG[project.stage]
  const overdue = isOverdue(project.deadline)
  const deadlineFormatted = formatDate(project.deadline)
  const valueFormatted = formatCurrency(project.value)

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-150 group"
    >
      {/* Project Name */}
      <p className="text-sm font-semibold text-gray-800 group-hover:text-amber-800 line-clamp-2 leading-tight">
        {project.name}
      </p>

      {/* Customer */}
      {project.customers && (
        <p className="text-xs text-gray-500 mt-1.5 truncate">{project.customers.name}</p>
      )}

      {/* Value */}
      {valueFormatted && (
        <div className="flex items-center gap-1 mt-2">
          <DollarSign className="w-3 h-3 text-green-600 flex-shrink-0" />
          <span className="text-xs font-semibold text-green-700">{valueFormatted}</span>
        </div>
      )}

      {/* Deadline + Sales */}
      <div className="flex items-center justify-between mt-2 gap-1">
        {deadlineFormatted ? (
          <div
            className={`flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-400'}`}
          >
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">{deadlineFormatted}</span>
            {overdue && <span className="text-xs font-medium">เกินกำหนด</span>}
          </div>
        ) : (
          <span />
        )}

        {project.sales_profile && (
          <div className="flex items-center gap-1 text-gray-400">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs truncate max-w-[80px]">
              {project.sales_profile.full_name.split(' ')[0]}
            </span>
          </div>
        )}
      </div>

      {/* Stage Badge (subtle) */}
      <div
        className={`mt-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}
      >
        {config.label}
      </div>
    </button>
  )
}
