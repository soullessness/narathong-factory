import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const departmentId = searchParams.get('department_id')
  const status = searchParams.get('status')

  // Get user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  const isManager = ['admin', 'factory_manager', 'executive'].includes(role)
  const isTeamLead = role === 'team_lead'

  let query = supabase
    .from('worker_logs')
    .select(`
      *,
      worker:profiles!worker_logs_worker_id_fkey (full_name),
      department:departments (name),
      project:projects (name),
      approver:profiles!worker_logs_approved_by_fkey (full_name),
      team:teams (name)
    `)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })

  // worker sees only their own logs; team_lead can see their team
  if (!isManager && !isTeamLead) {
    query = query.eq('worker_id', user.id)
  } else if (isTeamLead && !isManager) {
    // team_lead sees own logs + their team's logs
    if (profile?.team_id) {
      query = query.eq('team_id', profile.team_id)
    } else {
      query = query.eq('worker_id', user.id)
    }
  }

  // Apply filters
  if (date) {
    query = query.eq('log_date', date)
  }
  if (departmentId && isManager) {
    query = query.eq('department_id', departmentId)
  }
  if (status) {
    query = query.eq('status', status)
  }

  // team filter for manager
  const teamId = searchParams.get('team_id')
  if (teamId && isManager) {
    query = query.eq('team_id', teamId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Get user's department and team
  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id, team_id')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabase
    .from('worker_logs')
    .insert({
      worker_id: user.id,
      department_id: profile?.department_id ?? null,
      team_id: body.team_id ?? profile?.team_id ?? null,
      project_id: body.project_id ?? null,
      log_date: body.log_date,
      description: body.description,
      quantity: body.quantity ?? null,
      unit: body.unit ?? null,
      hours_worked: body.hours_worked ?? null,
      notes: body.notes ?? null,
      status: 'pending',
    })
    .select(`
      *,
      worker:profiles!worker_logs_worker_id_fkey (full_name),
      department:departments (name),
      project:projects (name),
      approver:profiles!worker_logs_approved_by_fkey (full_name),
      team:teams (name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
