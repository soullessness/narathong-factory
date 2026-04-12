import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_steps')
      .select(
        `
        *,
        department:departments (name),
        team:teams (name),
        assignee:profiles!production_steps_assigned_to_fkey (full_name),
        completer:profiles!production_steps_completed_by_fkey (full_name)
      `
      )
      .eq('order_id', id)
      .order('step_number', { ascending: true })

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

    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile.data?.role || user.user_metadata?.role

    if (!['admin', 'factory_manager'].includes(role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เพิ่ม Step' }, { status: 403 })
    }

    const body = await request.json()
    const { step_number, name, department_id, team_id, description, estimated_days } = body

    if (!name) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อ Step' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_steps')
      .insert({
        order_id: id,
        step_number: step_number || 1,
        name,
        department_id: department_id || null,
        team_id: team_id || null,
        description: description || null,
        estimated_days: estimated_days || null,
        status: 'pending',
      })
      .select(
        `
        *,
        department:departments (name),
        team:teams (name)
      `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const profile = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const role = profile.data?.role || user.user_metadata?.role

    if (!['admin', 'factory_manager'].includes(role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข Steps' }, { status: 403 })
    }

    const body = await request.json()
    const { steps } = body as {
      steps: Array<{
        id?: string
        step_number: number
        name: string
        department_id?: string
        team_id?: string
        description?: string
        estimated_days?: number
      }>
    }

    if (!Array.isArray(steps)) {
      return NextResponse.json({ error: 'Invalid steps data' }, { status: 400 })
    }

    // Delete existing steps for this order
    await supabase.from('production_steps').delete().eq('order_id', id)

    // Insert new steps
    if (steps.length > 0) {
      const toInsert = steps.map((s) => ({
        order_id: id,
        step_number: s.step_number,
        name: s.name,
        department_id: s.department_id || null,
        team_id: s.team_id || null,
        description: s.description || null,
        estimated_days: s.estimated_days || null,
        status: 'pending',
      }))

      const { data, error } = await supabase
        .from('production_steps')
        .insert(toInsert)
        .select(
          `
          *,
          department:departments (name),
          team:teams (name)
        `
        )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    }

    return NextResponse.json({ data: [] })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
