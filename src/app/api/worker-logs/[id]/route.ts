import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Get user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  const isApprover = ['admin', 'factory_manager', 'team_lead'].includes(role)

  // Get the existing log
  const { data: log, error: fetchError } = await supabase
    .from('worker_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !log) {
    return NextResponse.json({ error: 'ไม่พบบันทึกงาน' }, { status: 404 })
  }

  // Determine what action to take
  const action = body.action // 'approve' | 'reject' | 'edit'

  if (action === 'approve' || action === 'reject') {
    // Only approvers can approve/reject
    if (!isApprover) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติ' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {
      status: action === 'approve' ? 'approved' : 'rejected',
    }

    if (action === 'approve') {
      updateData.approved_by = user.id
      updateData.approved_at = new Date().toISOString()
    }

    if (action === 'reject') {
      if (!body.notes) {
        return NextResponse.json({ error: 'กรุณาระบุเหตุผลในการปฏิเสธ' }, { status: 400 })
      }
      updateData.notes = body.notes
    }

    const { data, error } = await supabase
      .from('worker_logs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        worker:profiles!worker_logs_worker_id_fkey (full_name),
        department:departments (name),
        project:projects (name),
        approver:profiles!worker_logs_approved_by_fkey (full_name)
      `)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Edit action — worker can only edit their own pending logs
  if (log.worker_id !== user.id) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไข' }, { status: 403 })
  }

  if (log.status !== 'pending') {
    return NextResponse.json({ error: 'แก้ไขได้เฉพาะบันทึกที่ยังรออนุมัติ' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('worker_logs')
    .update({
      log_date: body.log_date ?? log.log_date,
      description: body.description ?? log.description,
      quantity: body.quantity ?? null,
      unit: body.unit ?? null,
      hours_worked: body.hours_worked ?? null,
      project_id: body.project_id ?? null,
      notes: body.notes ?? null,
    })
    .eq('id', id)
    .select(`
      *,
      worker:profiles!worker_logs_worker_id_fkey (full_name),
      department:departments (name),
      project:projects (name),
      approver:profiles!worker_logs_approved_by_fkey (full_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
