import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { id, stepId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await supabase.from('profiles').select('role, team_id').eq('id', user.id).single()
    const role = profile.data?.role || user.user_metadata?.role
    const userTeamId = profile.data?.team_id

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    const isManager = ['admin', 'factory_manager'].includes(role)
    const isWorker = ['team_lead', 'worker'].includes(role)

    if (isManager) {
      // Manager can update all fields
      if (body.name !== undefined) updates.name = body.name
      if (body.department_id !== undefined) updates.department_id = body.department_id || null
      if (body.team_id !== undefined) updates.team_id = body.team_id || null
      if (body.estimated_days !== undefined) updates.estimated_days = body.estimated_days || null
      if (body.description !== undefined) updates.description = body.description || null
      if (body.status === 'skipped') updates.status = 'skipped'
    }

    if (isWorker || isManager) {
      // Worker/team_lead can change status to in_progress or completed
      if (body.status === 'in_progress' || body.status === 'completed') {
        // Check if step belongs to user's team (for workers)
        if (isWorker) {
          const { data: step } = await supabase
            .from('production_steps')
            .select('team_id, status')
            .eq('id', stepId)
            .single()

          if (!step) {
            return NextResponse.json({ error: 'ไม่พบ Step' }, { status: 404 })
          }

          if (step.team_id && step.team_id !== userTeamId) {
            return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข Step นี้' }, { status: 403 })
          }
        }

        updates.status = body.status

        if (body.status === 'in_progress') {
          updates.started_at = new Date().toISOString()
        } else if (body.status === 'completed') {
          updates.completed_at = new Date().toISOString()
          updates.completed_by = user.id
        }
      }

      if (body.notes !== undefined) updates.notes = body.notes
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'ไม่มีข้อมูลที่จะอัปเดต' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_steps')
      .update(updates)
      .eq('id', stepId)
      .eq('order_id', id)
      .select(
        `
        *,
        department:departments (name),
        team:teams (name),
        assignee:profiles!production_steps_assigned_to_fkey (full_name),
        completer:profiles!production_steps_completed_by_fkey (full_name)
      `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto set next step to in_progress when current step is completed
    if (updates.status === 'completed') {
      const { data: currentStep } = await supabase
        .from('production_steps')
        .select('step_number')
        .eq('id', stepId)
        .single()

      if (currentStep) {
        const { data: nextStep } = await supabase
          .from('production_steps')
          .select('id, status')
          .eq('order_id', id)
          .eq('step_number', currentStep.step_number + 1)
          .single()

        if (nextStep && nextStep.status === 'pending') {
          await supabase
            .from('production_steps')
            .update({ status: 'in_progress', started_at: new Date().toISOString() })
            .eq('id', nextStep.id)
        }

        // Check if all steps are completed → update order status
        const { data: allSteps } = await supabase
          .from('production_steps')
          .select('status')
          .eq('order_id', id)

        if (allSteps && allSteps.every((s) => s.status === 'completed' || s.status === 'skipped')) {
          await supabase
            .from('production_orders')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', id)
        }
      }
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
