import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Quotation } from '@/types/quotation'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { data, error } = await supabase
    .from('quotations')
    .select(`
      *,
      projects (
        id, name, project_code,
        customers ( id, name, address, phone, email )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ data: enrichWithMeta(data as Quotation) })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Re-embed meta if notes/vat/sales fields are present
  if (body.discount_type !== undefined || body.vat_enabled !== undefined ||
      body.sales_name !== undefined || body.agent_name !== undefined) {
    // First get current meta
    const { data: current } = await supabase
      .from('quotations')
      .select('notes')
      .eq('id', id)
      .single()
    const currentMeta = parseMeta((current as { notes?: string } | null)?.notes ?? null)
    const metaNote = `__META__${JSON.stringify({
      discount_type: body.discount_type ?? currentMeta.discount_type,
      vat_enabled: body.vat_enabled ?? currentMeta.vat_enabled,
      vat_amount: body.vat_amount ?? currentMeta.vat_amount,
      sales_name: body.sales_name !== undefined ? body.sales_name : (currentMeta.sales_name ?? null),
      sales_phone: body.sales_phone !== undefined ? body.sales_phone : (currentMeta.sales_phone ?? null),
      agent_name: body.agent_name !== undefined ? body.agent_name : (currentMeta.agent_name ?? null),
      agent_phone: body.agent_phone !== undefined ? body.agent_phone : (currentMeta.agent_phone ?? null),
    })}__END__`
    // Strip old meta from notes
    const cleanNotes = (body.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim()
    body.notes = cleanNotes ? `${cleanNotes}\n${metaNote}` : metaNote
    delete body.discount_type
    delete body.vat_enabled
    delete body.vat_amount
    delete body.sales_name
    delete body.sales_phone
    delete body.agent_name
    delete body.agent_phone
  }

  const { data, error } = await supabase
    .from('quotations')
    .update(body)
    .eq('id', id)
    .select(`
      *,
      projects (
        id, name, project_code,
        customers ( id, name, address, phone, email )
      )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: enrichWithMeta(data as Quotation) })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Re-embed meta if notes/vat/sales fields are present
  if (body.discount_type !== undefined || body.vat_enabled !== undefined ||
      body.sales_name !== undefined || body.agent_name !== undefined) {
    // First get current meta
    const { data: current } = await supabase
      .from('quotations')
      .select('notes')
      .eq('id', id)
      .single()
    const currentMeta = parseMeta((current as { notes?: string } | null)?.notes ?? null)
    const metaNote = `__META__${JSON.stringify({
      discount_type: body.discount_type ?? currentMeta.discount_type,
      vat_enabled: body.vat_enabled ?? currentMeta.vat_enabled,
      vat_amount: body.vat_amount ?? currentMeta.vat_amount,
      sales_name: body.sales_name !== undefined ? body.sales_name : (currentMeta.sales_name ?? null),
      sales_phone: body.sales_phone !== undefined ? body.sales_phone : (currentMeta.sales_phone ?? null),
      agent_name: body.agent_name !== undefined ? body.agent_name : (currentMeta.agent_name ?? null),
      agent_phone: body.agent_phone !== undefined ? body.agent_phone : (currentMeta.agent_phone ?? null),
    })}__END__`
    // Strip old meta from notes
    const cleanNotes = (body.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim()
    body.notes = cleanNotes ? `${cleanNotes}\n${metaNote}` : metaNote
    delete body.discount_type
    delete body.vat_enabled
    delete body.vat_amount
    delete body.sales_name
    delete body.sales_phone
    delete body.agent_name
    delete body.agent_phone
  }

  const { data, error } = await supabase
    .from('quotations')
    .update(body)
    .eq('id', id)
    .select(`
      *,
      projects (
        id, name, project_code,
        customers ( id, name, address, phone, email )
      )
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: enrichWithMeta(data as Quotation) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const { error } = await supabase
    .from('quotations')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
