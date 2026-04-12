import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/profiles/me — ดึง profile ของ current user ด้วย service role (bypass RLS)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('id, full_name, role, department_id, team_id, phone, is_active')
    .eq('id', user.id)
    .single()

  return NextResponse.json(profile ?? { id: user.id, role: 'worker' })
}
