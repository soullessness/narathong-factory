import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: quotation, error } = await supabase
      .from('quotations')
      .select(`*, projects(name, customers(name, address, phone))`)
      .eq('id', id)
      .single()

    if (error || !quotation) {
      return NextResponse.json({ error: 'ไม่พบใบเสนอราคา' }, { status: 404 })
    }

    // Parse meta from notes if exists
    const metaMatch = (quotation.notes || '').match(/__META__([\s\S]*?)__END__/)
    if (metaMatch) {
      try {
        const meta = JSON.parse(metaMatch[1])
        quotation.discount_type = meta.discount_type || 'amount'
        quotation.vat_enabled = meta.vat_enabled ?? true
        quotation.vat_amount = meta.vat_amount || 0
        quotation.notes = (quotation.notes || '').replace(/__META__[\s\S]*?__END__/, '').trim()
      } catch { /* ignore */ }
    }

    const ReactPDF = await import('@react-pdf/renderer')
    const React = (await import('react')).default
    const { QuotationPDF } = await import('@/components/quotation/QuotationPDFServer')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(QuotationPDF as any, { quotation }) as any
    const buffer = await ReactPDF.renderToBuffer(element)
    const uint8Array = new Uint8Array(buffer)

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="quotation-${quotation.quotation_number || id}.pdf"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'PDF generation failed' },
      { status: 500 }
    )
  }
}
