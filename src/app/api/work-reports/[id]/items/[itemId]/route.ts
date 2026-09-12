import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
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
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
  }
  if (!isManager && report.status !== 'draft') {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายงานที่ส่งแล้ว' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if (body.worker_id !== undefined) updates.worker_id = body.worker_id
  if (body.work_type_id !== undefined) updates.work_type_id = body.work_type_id
  if (body.quantity !== undefined) updates.quantity = body.quantity
  if (body.unit_id !== undefined) updates.unit_id = body.unit_id
  if (body.hours_worked !== undefined) updates.hours_worked = body.hours_worked
  if (body.good_quantity !== undefined) updates.good_quantity = body.good_quantity
  if (body.reject_quantity !== undefined) updates.reject_quantity = body.reject_quantity
  if (body.note !== undefined) updates.note = body.note
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  const { data, error } = await supabase
    .from('work_report_items')
    .update(updates)
    .eq('id', itemId)
    .eq('work_report_id', id)
    .select(`
      *,
      worker:profiles!work_report_items_worker_id_fkey (id, full_name),
      work_type:work_types (id, name, code),
      unit:units (id, name, symbol)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id, itemId } = await params
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
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบ' }, { status: 403 })
  }
  if (!isManager && report.status !== 'draft') {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายงานที่ส่งแล้ว' }, { status: 403 })
  }

  const { error } = await supabase
    .from('work_report_items')
    .delete()
    .eq('id', itemId)
    .eq('work_report_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
