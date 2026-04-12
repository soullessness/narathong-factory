import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('production_step_logs')
      .select(
        `
        *,
        worker:profiles!production_step_logs_worker_id_fkey (full_name)
      `
      )
      .eq('step_id', stepId)
      .order('created_at', { ascending: false })

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
  { params }: { params: Promise<{ id: string; stepId: string }> }
) {
  try {
    const { stepId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { message, quantity, unit } = body

    if (!message) {
      return NextResponse.json({ error: 'กรุณากรอกข้อความ' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('production_step_logs')
      .insert({
        step_id: stepId,
        worker_id: user.id,
        message,
        quantity: quantity || null,
        unit: unit || null,
      })
      .select(
        `
        *,
        worker:profiles!production_step_logs_worker_id_fkey (full_name)
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
