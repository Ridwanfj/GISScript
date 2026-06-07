import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

// Force dynamic rendering — never pre-render this route at build time
export const dynamic = 'force-dynamic'

const ALLOWED_LAYERS = [
  'garis_kota',
  'kecamatan',
  'kelurahan',
  'pola_rdtr',
  'koordinat_menengah_dan_besar',
  'ipro',
]

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> | { name: string } }
) {
  // Support both Promise (Next 15+) and object (Next < 15)
  const resolvedParams = await Promise.resolve(params)
  const name = resolvedParams?.name

  console.log(`[API Layer] Received request for name: "${name}"`, { resolvedParams })

  if (!name || !ALLOWED_LAYERS.includes(name)) {
    console.log(`[API Layer] Name "${name}" not in ALLOWED_LAYERS, returning 404`)
    return NextResponse.json({ error: 'Layer not found' }, { status: 404 })
  }

  try {
    const supabase = getSupabase()
    const { data, error } = await supabase.rpc('get_layer_geojson', {
      layer_name: name,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
