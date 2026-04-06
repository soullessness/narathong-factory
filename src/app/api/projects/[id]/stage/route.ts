import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CRMStage } from '@/types/crm'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('crm_stage_logs')
      .select(
        `
        *,
        changer_profile:profiles!crm_stage_logs_changed_by_fkey (id, full_name, role)
      `
      )
      .eq('project_id', id)
      .order('changed_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: { stage: CRMStage; note?: string; value?: number; deposit_amount?: number } = await request.json()

    if (!body.stage) {
      return NextResponse.json({ error: 'Stage จำเป็นต้องระบุ' }, { status: 400 })
    }

    // Get current project stage
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('id, stage')
      .eq('id', id)
      .single()

    if (fetchError || !project) {
      return NextResponse.json({ error: 'ไม่พบโปรเจค' }, { status: 404 })
    }

    const fromStage = project.stage

    // Update project stage
    const { data: updated, error: updateError } = await supabase
      .from('projects')
      .update({
        stage: body.stage,
        status: body.stage === 'completed' || body.stage === 'cancelled' ? body.stage : 'active',
        ...(body.value !== undefined && { value: body.value }),
        ...(body.deposit_amount !== undefined && { deposit_amount: body.deposit_amount }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(
        `
        *,
        customers (id, name, contact_name, phone, email, address, customer_type, notes),
        sales_profile:profiles!projects_assigned_sales_fkey (id, full_name, role)
      `
      )
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log stage change
    const { error: logError } = await supabase.from('crm_stage_logs').insert({
      project_id: id,
      from_stage: fromStage,
      to_stage: body.stage,
      note: body.note || null,
      changed_by: user.id,
    })

    if (logError) {
      console.error('Failed to log stage change:', logError)
    }

    return NextResponse.json({ data: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
