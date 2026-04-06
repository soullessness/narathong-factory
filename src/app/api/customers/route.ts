import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateCustomerInput } from '@/types/crm'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCustomerInput = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'ชื่อลูกค้าจำเป็นต้องกรอก' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: body.name,
        contact_name: body.contact_name || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        customer_type: body.customer_type || 'retail',
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
