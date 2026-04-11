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

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAllowed = profile?.role === 'factory_head' || profile?.role === 'admin'
  if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()

  // Insert response
  const { data: responseData, error: responseError } = await supabase
    .from('price_request_responses')
    .insert({
      request_id: id,
      responded_by: user.id,
      unit_price: body.unit_price,
      total_price: body.total_price,
      production_days: body.production_days ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()

  if (responseError) return NextResponse.json({ error: responseError.message }, { status: 500 })

  // Update status to 'quoted'
  const { error: updateError } = await supabase
    .from('price_requests')
    .update({ status: 'quoted', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ data: responseData }, { status: 201 })
}
