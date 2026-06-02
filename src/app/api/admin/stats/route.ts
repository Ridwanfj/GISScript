import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TABLES = [
  'garis_kota',
  'kecamatan',
  'kelurahan',
  'pola_rdtr',
  'koordinat_menengah_dan_besar',
]

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const stats: Record<string, number> = {}

    await Promise.all(
      TABLES.map(async (table) => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        stats[table] = error ? 0 : (count ?? 0)
      })
    )

    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
