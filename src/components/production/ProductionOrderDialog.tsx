'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CRMProject } from '@/types/crm'
import { Loader2 } from 'lucide-react'

interface ProductionOrderDialogProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
  preselectedProjectId?: string
}

const ELIGIBLE_STAGES = [
  'deposit',
  'production',
  'delivery',
  'installation',
  'completed',
]

export function ProductionOrderDialog({
  open,
  onClose,
  onSaved,
  preselectedProjectId,
}: ProductionOrderDialogProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<CRMProject[]>([])
  const [projectId, setProjectId] = useState(preselectedProjectId || '')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchProjects()
      setProjectId(preselectedProjectId || '')
      setNotes('')
      setError(null)
    }
  }, [open, preselectedProjectId])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const json = await res.json()
      const eligible = (json.data || []).filter((p: CRMProject) =>
        ELIGIBLE_STAGES.includes(p.stage)
      )
      setProjects(eligible)
    } catch {
      // ignore
    }
  }

  const handleSubmit = async () => {
    if (!projectId) {
      setError('กรุณาเลือกโปรเจค')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/production-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, notes }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'เกิดข้อผิดพลาด')
        return
      }

      onSaved?.()
      onClose()
      router.push(`/production-orders/${json.data.id}`)
    } catch {
      setError('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>สร้าง Production Order ใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>โปรเจค *</Label>
            <Select value={projectId} onValueChange={(v) => setProjectId(v ?? '')}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกโปรเจค" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_code ? `[${p.project_code}] ` : ''}{p.name}
                    {p.customers ? ` — ${p.customers.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="หมายเหตุ (ถ้ามี)"
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !projectId}
            style={{ backgroundColor: '#2BA8D4' }}
            className="text-white"
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            สร้าง Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
