import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const category_id = searchParams.get('category_id')
    const search = searchParams.get('search')
    const activeOnly = searchParams.get('active') !== 'false'

    let query = supabase
      .from('products')
      .select(`*, category:product_categories(*)`)
      .order('created_at', { ascending: false })

    if (activeOnly) query = query.eq('is_active', true)
    if (category_id) query = query.eq('category_id', category_id)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    if (!body.name) return NextResponse.json({ error: 'ชื่อสินค้าจำเป็นต้องกรอก' }, { status: 400 })

    const { data, error } = await supabase
      .from('products')
      .insert({
        category_id: body.category_id || null,
        name: body.name,
        description: body.description || null,
        sku: body.sku || null,
        image_url: body.image_url || null,
        unit: body.unit || 'แผ่น',
        price_per_unit: body.price_per_unit || 0,
        width_mm: body.width_mm || null,
        length_m: body.length_m || null,
        pieces_per_pack: body.pieces_per_pack || null,
        price_per_pack: body.price_per_pack || null,
        is_active: body.is_active ?? true,
      })
      .select(`*, category:product_categories(*)`)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 })
  }
}
