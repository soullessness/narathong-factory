import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('work_report_items')
    .select(`
      *,
      worker:profiles!work_report_items_worker_id_fkey (id, full_name),
      work_type:work_types (id, name, code),
      unit:units (id, name, symbol)
    `)
    .eq('work_report_id', id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

// PUT: replace all items (delete existing, insert new batch)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: report } = await supabase
    .from('work_reports')
    .select('status, created_by')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? ''
  const isManager = ['admin', 'factory_manager', 'team_lead'].includes(role)
  const isOwner = report.created_by === user.id

  if (!isManager && !isOwner) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขรายการ' }, { status: 403 })
  }
  if (!isManager && report.status !== 'draft') {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายงานที่ส่งแล้ว' }, { status: 403 })
  }

  const items: Array<Record<string, unknown>> = await req.json()

  // Delete all existing items
  const { error: delErr } = await supabase
    .from('work_report_items')
    .delete()
    .eq('work_report_id', id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  if (items.length === 0) return NextResponse.json({ data: [] })

  // Insert new batch
  const { data, error } = await supabase
    .from('work_report_items')
    .insert(
      items.map((item, i) => ({
        work_report_id: id,
        worker_id: item.worker_id ?? user.id,
        work_type_id: item.work_type_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        hours_worked: item.hours_worked ?? null,
        good_quantity: item.good_quantity ?? null,
        reject_quantity: item.reject_quantity ?? null,
        note: item.note ?? null,
        sort_order: i + 1,
      }))
    )
    .select(`
      *,
      worker:profiles!work_report_items_worker_id_fkey (id, full_name),
      work_type:work_types (id, name, code),
      unit:units (id, name, symbol)
    `)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check report exists and is editable
  const { data: report } = await supabase
    .from('work_reports')
    .select('status, created_by')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? ''
  const isManager = ['admin', 'factory_manager', 'team_lead'].includes(role)
  const isOwner = report.created_by === user.id

  if (!isManager && !isOwner) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์เพิ่มรายการ' }, { status: 403 })
  }

  if (!isManager && report.status !== 'draft') {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายงานที่ส่งแล้ว' }, { status: 403 })
  }

  const body = await req.json()

  // Get max sort_order
  const { data: maxItem } = await supabase
    .from('work_report_items')
    .select('sort_order')
    .eq('work_report_id', id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSortOrder = (maxItem?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('work_report_items')
    .insert({
      work_report_id: id,
      worker_id: body.worker_id ?? user.id,
      work_type_id: body.work_type_id,
      quantity: body.quantity,
      unit_id: body.unit_id,
      hours_worked: body.hours_worked ?? null,
      good_quantity: body.good_quantity ?? null,
      reject_quantity: body.reject_quantity ?? null,
      note: body.note ?? null,
      sort_order: body.sort_order ?? nextSortOrder,
    })
    .select(`
      *,
      worker:profiles!work_report_items_worker_id_fkey (id, full_name),
      work_type:work_types (id, name, code),
      unit:units (id, name, symbol)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
