import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function requireManagerOrAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401, user: null, role: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? ''
  const allowed = ['admin', 'factory_manager']
  if (!allowed.includes(role)) return { error: 'Forbidden', status: 403, user: null, role: null }

  return { error: null, status: 200, user, role }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const departmentId = searchParams.get('department_id')

  let query = supabase
    .from('teams')
    .select(`
      *,
      department:departments (name),
      lead:profiles!teams_lead_id_fkey (full_name),
      members:profiles!profiles_team_id_fkey (id)
    `)
    .order('name', { ascending: true })

  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Map members count
  const result = (data ?? []).map((t) => ({
    ...t,
    member_count: Array.isArray(t.members) ? t.members.length : 0,
    members: undefined,
  }))

  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const check = await requireManagerOrAdmin(supabase)
  if (check.error) {
    return NextResponse.json({ error: check.error }, { status: check.status })
  }

  const body = await req.json()
  const { name, department_id, lead_id, description } = body

  if (!name?.trim()) return NextResponse.json({ error: 'กรุณากรอกชื่อทีม' }, { status: 400 })
  if (!department_id) return NextResponse.json({ error: 'กรุณาเลือกแผนก' }, { status: 400 })

  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: name.trim(),
      department_id,
      lead_id: lead_id || null,
      description: description?.trim() || null,
      is_active: true,
    })
    .select(`
      *,
      department:departments (name),
      lead:profiles!teams_lead_id_fkey (full_name)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { ...data, member_count: 0 } }, { status: 201 })
}
