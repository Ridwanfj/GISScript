import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('koordinat_menengah_dan_besar')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const body = await req.json()

    const { data, error } = await supabase
      .from('koordinat_menengah_dan_besar')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const { error } = await supabase
      .from('koordinat_menengah_dan_besar')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
