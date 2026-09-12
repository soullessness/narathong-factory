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
    .from('work_reports')
    .select(`
      *,
      team:teams (id, name),
      department:departments (id, name),
      creator:profiles!work_reports_created_by_fkey (id, full_name),
      approver:profiles!work_reports_approved_by_fkey (id, full_name),
      items:work_report_items (
        *,
        worker:profiles!work_report_items_worker_id_fkey (id, full_name),
        work_type:work_types (id, name, code),
        unit:units (id, name, symbol)
      ),
      approvals:report_approvals (
        *,
        actor:profiles!report_approvals_action_by_fkey (full_name)
      )
    `)
    .eq('id', id)
    .order('sort_order', { foreignTable: 'work_report_items', ascending: true })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''

  // Fetch current report
  const { data: report } = await supabase
    .from('work_reports')
    .select('status, created_by')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 })

  const isManager = ['admin', 'factory_manager', 'team_lead'].includes(role)
  const isOwner = report.created_by === user.id

  // Only owner can edit draft; managers can update status
  if (!isManager && !isOwner) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
  }

  // Worker can only edit draft
  if (!isManager && isOwner && report.status !== 'draft') {
    return NextResponse.json({ error: 'ไม่สามารถแก้ไขรายงานที่ส่งแล้ว' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (body.notes !== undefined) updates.notes = body.notes
  if (body.status !== undefined) {
    // Worker can only submit (draft → submitted)
    if (!isManager && body.status !== 'submitted') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เปลี่ยนสถานะ' }, { status: 403 })
    }
    updates.status = body.status
    if (body.status === 'submitted') updates.submitted_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('work_reports')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      team:teams (id, name),
      department:departments (id, name),
      creator:profiles!work_reports_created_by_fkey (id, full_name),
      approver:profiles!work_reports_approved_by_fkey (id, full_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? ''
  const isAdmin = ['admin', 'factory_manager'].includes(role)

  const { data: report } = await supabase
    .from('work_reports')
    .select('status, created_by')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 })

  const isOwner = report.created_by === user.id

  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบ' }, { status: 403 })
  }

  if (!isAdmin && report.status !== 'draft') {
    return NextResponse.json({ error: 'ลบได้เฉพาะรายงานที่ยังเป็นฉบับร่าง' }, { status: 403 })
  }

  const { error } = await supabase.from('work_reports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
