import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('price_requests')
    .select(`
      *,
      requester:profiles!price_requests_requested_by_fkey (full_name),
      project:projects (name),
      quotation:quotations (quotation_number),
      response:price_request_responses (
        id, request_id, responded_by, unit_price, total_price, production_days, notes, responded_at,
        responder:profiles!price_request_responses_responded_by_fkey (full_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalized = {
    ...data,
    response: Array.isArray(data.response) ? (data.response[0] ?? null) : data.response,
  }

  return NextResponse.json({ data: normalized })
}

export async function PATCH(
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

  const { data, error } = await supabase
    .from('price_requests')
    .update({
      status: body.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
