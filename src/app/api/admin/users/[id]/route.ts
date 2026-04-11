import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', status: 401, user: null }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403, user: null }
  return { error: null, status: 200, user }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin()
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

    const { id } = await params
    const supabaseAdmin = createAdminClient()

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id)
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*, departments(id, name)')
      .eq('id', id)
      .single()
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 404 })

    return NextResponse.json({
      data: { ...profile, email: authUser.user.email },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin()
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

    const { id } = await params
    const body = await request.json()
    const { full_name, role, department_id, team_id, phone, is_active, password } = body

    const supabaseAdmin = createAdminClient()

    // Update password if provided
    if (password) {
      if (password.length < 8) {
        return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 })
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, { password })
      if (pwError) return NextResponse.json({ error: pwError.message }, { status: 500 })
    }

    // Update profile
    const updateData: Record<string, unknown> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (role !== undefined) updateData.role = role
    if (department_id !== undefined) updateData.department_id = department_id || null
    if (team_id !== undefined) updateData.team_id = team_id || null
    if (phone !== undefined) updateData.phone = phone || null
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select('*, departments(id, name)')
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)
    return NextResponse.json({ data: { ...profile, email: authUser?.user?.email ?? '' } })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const check = await requireAdmin()
    if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

    const { id } = await params

    // ห้ามลบตัวเอง
    if (check.user && check.user.id === id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตัวเองได้' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
