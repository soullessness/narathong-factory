import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("customer_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("GET customer_types error:", err)
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { data, error } = await supabase
      .from("customer_types")
      .insert(body)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("POST customer_types error:", err)
    return NextResponse.json({ error: "Failed to create" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, ...updateData } = body
    
    const { data, error } = await supabase
      .from("customer_types")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error("PUT customer_types error:", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }
    
    const supabase = await createClient()
    const { error } = await supabase
      .from("customer_types")
      .delete()
      .eq("id", id)
    
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE customer_types error:", err)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
