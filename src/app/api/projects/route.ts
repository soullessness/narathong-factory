import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateProjectInput } from '@/types/crm'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const stage = searchParams.get('stage')

    let query = supabase
      .from('projects')
      .select(
        `
        *,
        customers (id, name, contact_name, phone, email, customer_type),
        profiles (id, full_name, role)
      `
      )
      .order('created_at', { ascending: false })

    if (stage) {
      query = query.eq('stage', stage)
    }

    const { data, error } = await query

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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateProjectInput = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'ชื่อโปรเจคจำเป็นต้องกรอก' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: body.name,
        customer_id: body.customer_id || null,
        stage: body.stage || 'lead',
        value: body.value || null,
        deposit_amount: body.deposit_amount || null,
        deadline: body.deadline || null,
        assigned_sales: body.assigned_sales || null,
        notes: body.notes || null,
        created_by: user.id,
      })
      .select(
        `
        *,
        customers (id, name, contact_name, phone, email, customer_type),
        profiles (id, full_name, role)
      `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log initial stage
    await supabase.from('crm_stage_logs').insert({
      project_id: data.id,
      from_stage: null,
      to_stage: body.stage || 'lead',
      note: 'สร้างโปรเจคใหม่',
      changed_by: user.id,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
