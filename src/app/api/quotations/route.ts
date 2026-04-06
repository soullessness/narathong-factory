import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateQuotationInput, Quotation } from '@/types/quotation'

function parseMeta(notes: string | null): Record<string, unknown> {
  if (!notes) return {}
  const match = notes.match(/__META__([\s\S]*?)__END__/)
  if (!match) return {}
  try {
    return JSON.parse(match[1])
  } catch {
    return {}
  }
}

function enrichWithMeta(row: Quotation): Quotation {
  const meta = parseMeta(row.notes)
  return {
    ...row,
    discount_type: (meta.discount_type as 'amount' | 'percent') ?? 'amount',
    vat_enabled: (meta.vat_enabled as boolean) ?? false,
    vat_amount: (meta.vat_amount as number) ?? 0,
    sales_name: (meta.sales_name as string | null) ?? null,
    sales_phone: (meta.sales_phone as string | null) ?? null,
    agent_name: (meta.agent_name as string | null) ?? null,
    agent_phone: (meta.agent_phone as string | null) ?? null,
  }
}

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
  const enriched = (data as Quotation[]).map(enrichWithMeta)
  return NextResponse.json({ data: enriched })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body: CreateQuotationInput & {
    sales_name?: string | null
    sales_phone?: string | null
    agent_name?: string | null
    agent_phone?: string | null
  } = await req.json()

  // Store extra fields in __META__ block in notes
  const metaNote = `__META__${JSON.stringify({
    discount_type: body.discount_type,
    vat_enabled: body.vat_enabled,
    vat_amount: body.vat_amount,
    sales_name: body.sales_name ?? null,
    sales_phone: body.sales_phone ?? null,
    agent_name: body.agent_name ?? null,
    agent_phone: body.agent_phone ?? null,
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
  return NextResponse.json({ data: enrichWithMeta(data as Quotation) }, { status: 201 })
}
