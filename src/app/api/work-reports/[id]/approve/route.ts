import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
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
  const canApprove = ['admin', 'factory_manager', 'team_lead'].includes(role)

  if (!canApprove) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติ' }, { status: 403 })
  }

  const { data: report } = await supabase
    .from('work_reports')
    .select('status')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: 'ไม่พบรายงาน' }, { status: 404 })

  if (report.status !== 'submitted') {
    return NextResponse.json({ error: 'สามารถอนุมัติได้เฉพาะรายงานที่ส่งแล้วเท่านั้น' }, { status: 400 })
  }

  const body = await req.json()
  const action = body.action as 'approved' | 'rejected'
  const reason = body.reason ?? null

  if (!['approved', 'rejected'].includes(action)) {
    return NextResponse.json({ error: 'action ต้องเป็น approved หรือ rejected' }, { status: 400 })
  }

  // Insert approval record
  await supabase.from('report_approvals').insert({
    work_report_id: id,
    action_by: user.id,
    action_role: role,
    action,
    reason,
  })

  // Update report status
  const reportUpdate: Record<string, unknown> = {
    status: action,
  }
  if (action === 'approved') {
    reportUpdate.approved_at = new Date().toISOString()
    reportUpdate.approved_by = user.id
  }
  if (reason && action === 'rejected') {
    reportUpdate.notes = reason
  }

  const { data, error } = await supabase
    .from('work_reports')
    .update(reportUpdate)
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
