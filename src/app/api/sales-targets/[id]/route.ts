import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function getCurrentUserRole(): Promise<{ userId: string | null; role: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { userId: null, role: null }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return { userId: user.id, role: profile?.role ?? null }
}

// PATCH /api/sales-targets/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = await getCurrentUserRole()

  if (!role || !['admin', 'executive'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()
  const { target_amount, commission_rate, notes } = body

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (target_amount !== undefined) updateData.target_amount = target_amount
  if (commission_rate !== undefined) updateData.commission_rate = commission_rate
  if (notes !== undefined) updateData.notes = notes

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('sales_targets')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// DELETE /api/sales-targets/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { role } = await getCurrentUserRole()

  if (!role || !['admin', 'executive'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin
    .from('sales_targets')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
