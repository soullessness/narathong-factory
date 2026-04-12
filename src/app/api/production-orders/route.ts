import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const project_id = searchParams.get('project_id')

    let query = supabase
      .from('production_orders')
      .select(
        `
        *,
        project:projects (id, name, customers (name)),
        creator:profiles!production_orders_created_by_fkey (full_name),
        steps:production_steps (id, status)
      `
      )
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }
    if (project_id) {
      query = query.eq('project_id', project_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map steps count
    const enriched = (data || []).map((order) => {
      const steps = order.steps || []
      const steps_count = steps.length
      const completed_steps = steps.filter((s: { status: string }) => s.status === 'completed').length
      return { ...order, steps_count, completed_steps }
    })

    return NextResponse.json({ data: enriched })
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

    const profile = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile.data?.role || user.user_metadata?.role
    if (!['admin', 'executive', 'factory_manager'].includes(role)) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์สร้าง Production Order' }, { status: 403 })
    }

    const body = await request.json()
    const { project_id, notes } = body

    if (!project_id) {
      return NextResponse.json({ error: 'กรุณาเลือกโปรเจค' }, { status: 400 })
    }

    // Generate order number PO-YYYY-NNN
    const year = new Date().getFullYear()
    const { data: lastOrder } = await supabase
      .from('production_orders')
      .select('order_number')
      .like('order_number', `PO-${year}-%`)
      .order('order_number', { ascending: false })
      .limit(1)
      .single()

    let seq = 1
    if (lastOrder?.order_number) {
      const parts = lastOrder.order_number.split('-')
      const lastSeq = parseInt(parts[2] || '0', 10)
      seq = isNaN(lastSeq) ? 1 : lastSeq + 1
    }
    const order_number = `PO-${year}-${String(seq).padStart(3, '0')}`

    const { data, error } = await supabase
      .from('production_orders')
      .insert({
        project_id,
        order_number,
        status: 'pending',
        notes: notes || null,
        created_by: user.id,
      })
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

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
