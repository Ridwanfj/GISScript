import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SearchResult {
  type: 'kecamatan' | 'kelurahan' | 'proyek'
  name: string
  subtitle?: string
  coordinates: [number, number]
  zoom: number
  properties?: Record<string, unknown>
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  // Validate input — only allow safe characters
  if (!/^[\p{L}\p{N}\s._-]*$/u.test(q)) {
    return NextResponse.json(
      { error: 'Parameter search mengandung karakter tidak valid' },
      { status: 400 }
    )
  }

  const supabase = getSupabase()
  const results: SearchResult[] = []

  try {
    // 1. Search Kecamatan — uses the RPC to get GeoJSON and filters locally
    //    (Kecamatan only has 4 entries so it's efficient)
    const { data: kecData } = await supabase.rpc('get_layer_geojson', {
      layer_name: 'kecamatan',
    })

    if (kecData?.features) {
      for (const f of kecData.features) {
        const name = f.properties?.WADMKC
        if (name && String(name).toLowerCase().includes(q.toLowerCase())) {
          // Calculate centroid from polygon coordinates
          const centroid = getPolygonCentroid(f.geometry.coordinates)
          results.push({
            type: 'kecamatan',
            name: String(name),
            subtitle: `${f.properties?.WADMKK || 'Kota Tegal'}, ${f.properties?.WADMPR || 'Jawa Tengah'}`,
            coordinates: centroid,
            zoom: 14,
          })
        }
      }
    }

    // 2. Search Kelurahan
    const { data: kelData } = await supabase.rpc('get_layer_geojson', {
      layer_name: 'kelurahan',
    })

    if (kelData?.features) {
      for (const f of kelData.features) {
        const name = f.properties?.NAMOBJ
        if (name && String(name).toLowerCase().includes(q.toLowerCase())) {
          const centroid = getPolygonCentroid(f.geometry.coordinates)
          results.push({
            type: 'kelurahan',
            name: String(name),
            subtitle: `Kec. ${f.properties?.WADMKC || '-'}`,
            coordinates: centroid,
            zoom: 15,
          })
        }
      }
    }

    // 3. Search Proyek Investasi
    const { data: proyekData } = await supabase.rpc('get_layer_geojson', {
      layer_name: 'koordinat_menengah_dan_besar',
    })

    if (proyekData?.features) {
      for (const f of proyekData.features) {
        const props = f.properties || {}
        const nama = String(props.nama_proyek || '')
        const jenis = String(props['Uraian_Jenis_Proyek'] || '')
        const sektor = String(props.Sektor || '')
        
        const matches = 
          nama.toLowerCase().includes(q.toLowerCase()) ||
          jenis.toLowerCase().includes(q.toLowerCase()) ||
          sektor.toLowerCase().includes(q.toLowerCase())

        if (matches && f.geometry?.type === 'Point') {
          results.push({
            type: 'proyek',
            name: nama || 'Proyek tanpa nama',
            subtitle: sektor || jenis,
            coordinates: f.geometry.coordinates as [number, number],
            zoom: 17,
            properties: props,
          })
          
          if (results.length >= 25) break // Limit results for performance
        }
      }
    }

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function getPolygonCentroid(coordinates: any[]): [number, number] {
  let totalLng = 0,
    totalLat = 0,
    count = 0
  const traverse = (coords: any[]) => {
    if (typeof coords[0] === 'number') {
      totalLng += coords[0]
      totalLat += coords[1]
      count++
    } else {
      coords.forEach(traverse)
    }
  }
  traverse(coordinates)
  return count > 0 ? [totalLng / count, totalLat / count] : [0, 0]
}
