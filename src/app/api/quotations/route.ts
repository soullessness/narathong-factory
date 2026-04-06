import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateQuotationInput } from '@/types/quotation'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')

  let query = supabase
    .from('quotations')
    .select(`
      *,
      projects (
        id, name, project_code,
        customers ( id, name, address, phone, email )
      )
    `)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateQuotationInput = await req.json()

  // Store extra fields (discount_type, vat_enabled, vat_amount) in items metadata
  // since the DB schema doesn't have these columns directly
  // We'll embed them in items as a special "__meta" entry approach
  // Actually we'll store them in notes as JSON prefix or use a workaround
  // Better: store vat/discount_type in notes as base64 JSON suffix
  const metaNote = `__META__${JSON.stringify({
    discount_type: body.discount_type,
    vat_enabled: body.vat_enabled,
    vat_amount: body.vat_amount,
  })}__END__`
  const notesWithMeta = body.notes
    ? `${body.notes}\n${metaNote}`
    : metaNote

  const { data, error } = await supabase
    .from('quotations')
    .insert({
      project_id: body.project_id,
      quotation_number: body.quotation_number,
      items: body.items,
      subtotal: body.subtotal,
      discount: body.discount,
      total: body.total,
      status: body.status,
      valid_until: body.valid_until,
      notes: notesWithMeta,
      created_by: user.id,
    })
    .select(`
      *,
      projects (
        id, name, project_code,
        customers ( id, name, address, phone, email )
      )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
