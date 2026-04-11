import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401, user: null, supabase }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403, user: null, supabase }
  return { error: null, status: 200, user, supabase }
}

export async function GET() {
  try {
    const check = await requireAdmin()
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const supabaseAdmin = createAdminClient()

    // Get all auth users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    // Get all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, role, department_id, phone, is_active, created_at, departments(id, name)')
      .order('created_at', { ascending: false })

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    // Merge auth users with profiles
    const emailMap = new Map(authData.users.map((u) => [u.id, u.email ?? '']))
    const data = (profiles ?? []).map((p) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? '',
      full_name: p.full_name,
      role: p.role,
      department_id: p.department_id,
      department: p.departments,
      phone: p.phone,
      is_active: p.is_active,
      created_at: p.created_at,
    }))

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
    const check = await requireAdmin()
    if (check.error) {
      return NextResponse.json({ error: check.error }, { status: check.status })
    }

    const body = await request.json()
    const { email, password, full_name, role, department_id, team_id, phone } = body

    if (!email) return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 })
    if (!password || password.length < 8)
      return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
    if (!full_name) return NextResponse.json({ error: 'กรุณากรอกชื่อ-นามสกุล' }, { status: 400 })
    if (!role) return NextResponse.json({ error: 'กรุณาเลือก Role' }, { status: 400 })

    const supabaseAdmin = createAdminClient()

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    // Check if profile already exists (handle_new_user trigger may have created it)
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', authUser.user.id)
      .single()

    let profile
    let profileError

    if (existingProfile) {
      // trigger สร้าง profile ไปแล้ว → UPDATE แทน
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({
          full_name,
          role,
          department_id: department_id || null,
          team_id: team_id || null,
          phone: phone || null,
          is_active: true,
        })
        .eq('id', authUser.user.id)
        .select()
        .single()
      profile = data
      profileError = error
    } else {
      // ไม่มี profile → INSERT ปกติ
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authUser.user.id,
          full_name,
          role,
          department_id: department_id || null,
          team_id: team_id || null,
          phone: phone || null,
          is_active: true,
        })
        .select()
        .single()
      profile = data
      profileError = error
    }

    if (profileError) {
      // Rollback auth user on profile insert/update failure
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json(
      { data: { ...profile, email: authUser.user.email } },
      { status: 201 }
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
