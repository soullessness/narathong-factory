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

// GET /api/sales-targets?year=2025&month=4
export async function GET(request: NextRequest) {
  const { role } = await getCurrentUserRole()

  if (!role || !['admin', 'executive'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  const admin = createAdminClient()
  let query = admin
    .from('sales_targets')
    .select('*, sales:profiles!sales_targets_sales_id_fkey(full_name)')
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (year) query = query.eq('year', parseInt(year))
  if (month) query = query.eq('month', parseInt(month))

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

// POST /api/sales-targets — upsert by sales_id + year + month
export async function POST(request: NextRequest) {
  const { userId, role } = await getCurrentUserRole()

  if (!role || !['admin', 'executive'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await request.json()
  const { sales_id, year, month, target_amount, commission_rate, notes } = body

  if (!sales_id || !year || !month || target_amount === undefined || commission_rate === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check if target already exists
  const { data: existing } = await admin
    .from('sales_targets')
    .select('id')
    .eq('sales_id', sales_id)
    .eq('year', year)
    .eq('month', month)
    .single()

  let result
  if (existing) {
    // Update existing
    result = await admin
      .from('sales_targets')
      .update({
        target_amount,
        commission_rate,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single()
  } else {
    // Insert new
    result = await admin
      .from('sales_targets')
      .insert({
        sales_id,
        year,
        month,
        target_amount,
        commission_rate,
        notes,
        created_by: userId,
      })
      .select()
      .single()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json({ data: result.data })
}
