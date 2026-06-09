import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Admin endpoint to get ALL field visibility settings (including non-hidden).
 */
export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('field_visibility')
      .select('*')
      .order('layer_key')
      .order('field_key')

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ data: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * Admin endpoint to update field visibility settings.
 * Expects body: { layer_key: string, field_key: string, hidden_for_public: boolean }
 * Uses upsert — creates if not exists, updates if exists.
 */
export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const body = await req.json()

    const { layer_key, field_key, hidden_for_public } = body

    if (!layer_key || !field_key || typeof hidden_for_public !== 'boolean') {
      return NextResponse.json(
        { error: 'layer_key, field_key, dan hidden_for_public wajib diisi' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('field_visibility')
      .upsert(
        { layer_key, field_key, hidden_for_public },
        { onConflict: 'layer_key,field_key' }
      )
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

/**
 * Admin endpoint to bulk update field visibility.
 * Expects body: { updates: Array<{ layer_key: string, field_key: string, hidden_for_public: boolean }> }
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const body = await req.json()

    const { updates } = body
    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json({ error: 'updates array wajib diisi' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('field_visibility')
      .upsert(updates, { onConflict: 'layer_key,field_key' })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
