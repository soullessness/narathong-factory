import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id, department_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  const isManager = ['admin', 'factory_manager', 'executive'].includes(role)
  const isTeamLead = role === 'team_lead'

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const teamId = searchParams.get('team_id')
  const status = searchParams.get('status')

  let query = supabase
    .from('work_reports')
    .select(`
      *,
      team:teams (id, name),
      department:departments (id, name),
      creator:profiles!work_reports_created_by_fkey (id, full_name),
      approver:profiles!work_reports_approved_by_fkey (id, full_name)
    `)
    .order('report_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Visibility rules
  if (!isManager && !isTeamLead) {
    // Worker: only own reports
    query = query.eq('created_by', user.id)
  } else if (isTeamLead && !isManager) {
    // Team lead: own team's reports
    if (profile?.team_id) {
      query = query.eq('team_id', profile.team_id)
    } else {
      query = query.eq('created_by', user.id)
    }
  }

  if (date) query = query.eq('report_date', date)
  if (teamId && (isManager || isTeamLead)) query = query.eq('team_id', teamId)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id, department_id')
    .eq('id', user.id)
    .single()

  const body = await req.json()

  const { data, error } = await supabase
    .from('work_reports')
    .insert({
      report_date: body.report_date,
      team_id: body.team_id ?? profile?.team_id ?? null,
      department_id: body.department_id ?? profile?.department_id ?? null,
      created_by: user.id,
      status: 'draft',
      notes: body.notes ?? null,
    })
    .select(`
      *,
      team:teams (id, name),
      department:departments (id, name),
      creator:profiles!work_reports_created_by_fkey (id, full_name),
      approver:profiles!work_reports_approved_by_fkey (id, full_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
