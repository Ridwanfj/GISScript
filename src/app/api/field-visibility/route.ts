import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Public endpoint — returns the hidden fields configuration.
 * Used by the map popup to determine which fields to hide for public users.
 */
export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('field_visibility')
      .select('layer_key, field_key, hidden_for_public')
      .eq('hidden_for_public', true)

    if (error) {
      // If table doesn't exist yet, return empty array (graceful fallback)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ hiddenFields: {} })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by layer_key
    const hiddenFields: Record<string, string[]> = {}
    for (const row of data || []) {
      if (!hiddenFields[row.layer_key]) {
        hiddenFields[row.layer_key] = []
      }
      hiddenFields[row.layer_key].push(row.field_key)
    }

    return NextResponse.json({ hiddenFields }, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
