import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Public stats endpoint for the landing page.
 * Returns only aggregate counts — no sensitive or row-level data.
 */
export async function GET() {
  try {
    const supabase = getSupabase()

    // Count rows for each table (parallel)
    const [kecamatan, kelurahan, polaRdtr, investasi] = await Promise.all([
      supabase.from('kecamatan').select('*', { count: 'exact', head: true }),
      supabase.from('kelurahan').select('*', { count: 'exact', head: true }),
      supabase.from('pola_rdtr').select('*', { count: 'exact', head: true }),
      supabase.from('koordinat_menengah_dan_besar').select('*', { count: 'exact', head: true }),
    ])

    // Sum investment value and worker count from koordinat_menengah_dan_besar
    // Using aggregate via select — Supabase doesn't support SUM directly on REST,
    // so we fetch only the two numeric columns and calculate on the server.
    const { data: investData } = await supabase
      .from('koordinat_menengah_dan_besar')
      .select('"Jumlah Investasi", "TKI"')

    let totalInvestasi = 0
    let totalTKI = 0

    if (investData) {
      for (const row of investData) {
        // Parse "Jumlah Investasi" — could be formatted string like "1.500.000" or number
        const rawInvest = row['Jumlah Investasi']
        if (rawInvest != null) {
          const cleaned = String(rawInvest)
            .replace(/\./g, '')
            .replace(/,/g, '.')
            .replace(/[^0-9.\-]+/g, '')
          totalInvestasi += parseFloat(cleaned) || 0
        }

        // Parse TKI
        const rawTKI = row['TKI']
        if (rawTKI != null) {
          const cleaned = String(rawTKI).replace(/[^0-9.\-]+/g, '')
          totalTKI += parseFloat(cleaned) || 0
        }
      }
    }

    // Count unique RDTR zones (distinct NAMOBJ values)
    const { data: rdtrData } = await supabase
      .from('pola_rdtr')
      .select('NAMOBJ')

    const uniqueZones = rdtrData
      ? new Set(rdtrData.map((r: { NAMOBJ: string }) => r.NAMOBJ).filter(Boolean)).size
      : 0

    return NextResponse.json({
      kecamatan: kecamatan.count ?? 0,
      kelurahan: kelurahan.count ?? 0,
      zona_rdtr: uniqueZones || (polaRdtr.count ?? 0),
      proyek_investasi: investasi.count ?? 0,
      total_investasi: totalInvestasi,
      total_tki: totalTKI,
    }, {
      headers: {
        // Cache for 5 minutes, serve stale for 1 hour while revalidating
        'Cache-Control': 's-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
