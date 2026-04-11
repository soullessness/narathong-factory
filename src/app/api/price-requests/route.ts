import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const myOnly = searchParams.get('my') === '1'

  // Get user profile for role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isFactoryOrAdmin = profile?.role === 'factory_head' || profile?.role === 'admin'

  let query = supabase
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
    .order('created_at', { ascending: false })

  // Sales/cashier: only see their own requests
  if (!isFactoryOrAdmin || myOnly) {
    query = query.eq('requested_by', user.id)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten single-item response arrays
  const normalized = (data ?? []).map((item) => ({
    ...item,
    response: Array.isArray(item.response) ? (item.response[0] ?? null) : item.response,
  }))

  return NextResponse.json({ data: normalized })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const { data, error } = await supabase
    .from('price_requests')
    .insert({
      requested_by: user.id,
      product_type: body.product_type,
      product_name: body.product_name,
      spec: body.spec ?? null,
      quantity: body.quantity,
      unit: body.unit,
      deadline_date: body.deadline_date ?? null,
      project_id: body.project_id ?? null,
      quotation_id: body.quotation_id ?? null,
      status: 'pending',
    })
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
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalized = {
    ...data,
    response: Array.isArray(data.response) ? (data.response[0] ?? null) : data.response,
  }

  return NextResponse.json({ data: normalized }, { status: 201 })
}
