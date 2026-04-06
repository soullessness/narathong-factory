import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  return NextResponse.json({ data })
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

  // Re-embed meta if notes/vat fields are present
  if (body.discount_type !== undefined || body.vat_enabled !== undefined) {
    const metaNote = `__META__${JSON.stringify({
      discount_type: body.discount_type,
      vat_enabled: body.vat_enabled,
      vat_amount: body.vat_amount,
    })}__END__`
    // Strip old meta from notes
    const cleanNotes = (body.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim()
    body.notes = cleanNotes ? `${cleanNotes}\n${metaNote}` : metaNote
    delete body.discount_type
    delete body.vat_enabled
    delete body.vat_amount
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
  return NextResponse.json({ data })
}
