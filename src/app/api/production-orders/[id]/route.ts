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
      .from('production_orders')
      .select(
        `
        *,
        project:projects (id, name, customers (name)),
        creator:profiles!production_orders_created_by_fkey (full_name),
        steps:production_steps (
          *,
          department:departments (name),
          team:teams (name),
          assignee:profiles!production_steps_assigned_to_fkey (full_name),
          completer:profiles!production_steps_completed_by_fkey (full_name)
        )
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Sort steps by step_number
    if (data.steps) {
      data.steps.sort(
        (a: { step_number: number }, b: { step_number: number }) => a.step_number - b.step_number
      )
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.status !== undefined) updates.status = body.status
    if (body.notes !== undefined) updates.notes = body.notes
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('production_orders')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        project:projects (id, name, customers (name)),
        creator:profiles!production_orders_created_by_fkey (full_name)
      `
      )
      .single()

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

export async function DELETE(
  _request: NextRequest,
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

    if (role !== 'admin') {
      return NextResponse.json({ error: 'เฉพาะ admin เท่านั้นที่ลบได้' }, { status: 403 })
    }

    const { error } = await supabase.from('production_orders').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
