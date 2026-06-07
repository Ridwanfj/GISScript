import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface SearchResult {
  type: 'kecamatan' | 'kelurahan' | 'proyek' | 'ipro'
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

    // 4. Search IPRO
    const { data: iproData } = await supabase.rpc('get_layer_geojson', {
      layer_name: 'ipro',
    })

    if (iproData?.features) {
      for (const f of iproData.features) {
        const props = f.properties || {}
        const jenisIpro = String(props['JENIS IPRO'] || '')
        const alamat = String(props['ALAMAT'] || '')
        const no = String(props['NO'] || '')

        const matches =
          jenisIpro.toLowerCase().includes(q.toLowerCase()) ||
          alamat.toLowerCase().includes(q.toLowerCase()) ||
          no.toLowerCase().includes(q.toLowerCase())

        if (matches) {
          // Parse coordinates — may be a string "lng lat" or use Latitude/Longitude props
          let coords: [number, number] | null = null
          const rawCoords = f.geometry?.coordinates
          if (typeof rawCoords === 'string') {
            const parts = rawCoords.trim().split(/\s+/).map(Number)
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
              coords = [parts[0], parts[1]]
            }
          } else if (Array.isArray(rawCoords) && rawCoords.length >= 2) {
            coords = [rawCoords[0], rawCoords[1]]
          }
          // Fallback to Longitude/Latitude properties
          if (!coords) {
            const lng = parseFloat(String(props['Longitude'] || '0'))
            const lat = parseFloat(String(props['Latitude'] || '0'))
            if (lng !== 0 && lat !== 0) {
              coords = [lng, lat]
            }
          }

          if (coords) {
            results.push({
              type: 'ipro',
              name: jenisIpro || `IPRO #${no}`,
              subtitle: alamat || '-',
              coordinates: coords,
              zoom: 17,
              properties: props,
            })

            if (results.length >= 30) break
          }
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
