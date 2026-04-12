'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react'
import { DEFAULT_STEPS, ProductionStep } from '@/types/production'

interface Department {
  id: string
  name: string
}

interface Team {
  id: string
  name: string
  department_id: string
}

interface StepRow {
  tempId: string
  step_number: number
  name: string
  department_id: string
  team_id: string
  estimated_days: string
  description: string
}

interface StepEditorProps {
  orderId: string
  existingSteps: ProductionStep[]
  onSaved: () => void
}

export function StepEditor({ orderId, existingSteps, onSaved }: StepEditorProps) {
  const [steps, setSteps] = useState<StepRow[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDepartmentsAndTeams()
    if (existingSteps.length > 0) {
      setSteps(
        existingSteps.map((s) => ({
          tempId: s.id,
          step_number: s.step_number,
          name: s.name,
          department_id: s.department_id || '',
          team_id: s.team_id || '',
          estimated_days: s.estimated_days ? String(s.estimated_days) : '',
          description: s.description || '',
        }))
      )
    }
  }, [existingSteps])

  const fetchDepartmentsAndTeams = async () => {
    try {
      const [dRes, tRes] = await Promise.all([
        fetch('/api/departments'),
        fetch('/api/teams'),
      ])
      const [dJson, tJson] = await Promise.all([dRes.json(), tRes.json()])
      setDepartments(dJson.data || [])
      setTeams(tJson.data || [])
    } catch {
      // ignore
    }
  }

  const loadTemplate = () => {
    setSteps(
      DEFAULT_STEPS.map((s, i) => ({
        tempId: `temp-${i}`,
        step_number: s.step_number,
        name: s.name,
        department_id: '',
        team_id: '',
        estimated_days: '',
        description: s.description || '',
      }))
    )
  }

  const addStep = () => {
    const maxNum = steps.length > 0 ? Math.max(...steps.map((s) => s.step_number)) : 0
    setSteps([
      ...steps,
      {
        tempId: `new-${Date.now()}`,
        step_number: maxNum + 1,
        name: '',
        department_id: '',
        team_id: '',
        estimated_days: '',
        description: '',
      },
    ])
  }

  const removeStep = (tempId: string) => {
    const filtered = steps.filter((s) => s.tempId !== tempId)
    // Re-number
    setSteps(filtered.map((s, i) => ({ ...s, step_number: i + 1 })))
  }

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const newSteps = [...steps]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newSteps.length) return
    ;[newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]]
    // Re-number
    setSteps(newSteps.map((s, i) => ({ ...s, step_number: i + 1 })))
  }

  const updateStep = (tempId: string, field: keyof StepRow, value: string) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.tempId !== tempId) return s
        const updated = { ...s, [field]: value }
        // Reset team if department changes
        if (field === 'department_id') {
          updated.team_id = ''
        }
        return updated
      })
    )
  }

  const getTeamsForDept = (deptId: string) => {
    if (!deptId) return teams
    return teams.filter((t) => t.department_id === deptId)
  }

  const handleSave = async () => {
    if (steps.some((s) => !s.name.trim())) {
      setError('กรุณากรอกชื่อ Step ทุกรายการ')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/production-orders/${orderId}/steps`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: steps.map((s) => ({
            step_number: s.step_number,
            name: s.name.trim(),
            department_id: s.department_id || undefined,
            team_id: s.team_id || undefined,
            estimated_days: s.estimated_days ? Number(s.estimated_days) : undefined,
            description: s.description || undefined,
          })),
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'เกิดข้อผิดพลาด')
        return
      }

      onSaved()
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800">กำหนด Workflow</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTemplate}
          className="text-sky-600 border-sky-300 hover:bg-sky-50"
        >
          ใช้ Template มาตรฐาน
        </Button>
      </div>

      {steps.length === 0 && (
        <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm">ยังไม่มี Step</p>
          <p className="text-xs mt-1">กดปุ่ม &quot;ใช้ Template มาตรฐาน&quot; หรือ &quot;+ เพิ่ม Step&quot;</p>
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.tempId}
            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
          >
            <div className="flex items-start gap-2">
              {/* Step number + move buttons */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-1">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">
                  {step.step_number}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5"
                  onClick={() => moveStep(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-5 h-5"
                  onClick={() => moveStep(index, 'down')}
                  disabled={index === steps.length - 1}
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="col-span-2 sm:col-span-2">
                  <Label className="text-xs text-gray-500">ชื่อ Step *</Label>
                  <Input
                    value={step.name}
                    onChange={(e) => updateStep(step.tempId, 'name', e.target.value)}
                    placeholder="ชื่อขั้นตอน"
                    className="h-8 text-sm mt-0.5"
                  />
                </div>

                <div>
                  <Label className="text-xs text-gray-500">แผนก</Label>
                  <Select
                    value={step.department_id || 'none'}
                    onValueChange={(v) => updateStep(step.tempId, 'department_id', (v ?? 'none') === 'none' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="h-8 text-sm mt-0.5">
                      <SelectValue placeholder="เลือกแผนก" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ระบุ</SelectItem>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">ทีม</Label>
                  <Select
                    value={step.team_id || 'none'}
                    onValueChange={(v) => updateStep(step.tempId, 'team_id', (v ?? 'none') === 'none' ? '' : (v ?? ''))}
                  >
                    <SelectTrigger className="h-8 text-sm mt-0.5">
                      <SelectValue placeholder="เลือกทีม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่ระบุ</SelectItem>
                      {getTeamsForDept(step.department_id).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs text-gray-500">วันที่ประมาณ</Label>
                  <Input
                    type="number"
                    min="0"
                    value={step.estimated_days}
                    onChange={(e) => updateStep(step.tempId, 'estimated_days', e.target.value)}
                    placeholder="วัน"
                    className="h-8 text-sm mt-0.5"
                  />
                </div>

                <div className="col-span-2 sm:col-span-3">
                  <Label className="text-xs text-gray-500">รายละเอียด</Label>
                  <Input
                    value={step.description}
                    onChange={(e) => updateStep(step.tempId, 'description', e.target.value)}
                    placeholder="รายละเอียด (ถ้ามี)"
                    className="h-8 text-sm mt-0.5"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                onClick={() => removeStep(step.tempId)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={addStep}
          className="gap-1 text-sky-700 border-sky-300 hover:bg-sky-50"
        >
          <Plus className="w-4 h-4" />
          เพิ่ม Step
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || steps.length === 0}
          style={{ backgroundColor: '#2BA8D4' }}
          className="text-white gap-1"
        >
          {saving ? 'กำลังบันทึก...' : 'บันทึก Workflow'}
        </Button>
      </div>
    </div>
  )
}
