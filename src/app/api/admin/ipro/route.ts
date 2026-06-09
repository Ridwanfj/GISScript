import { getSupabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/adminAuth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const search = url.searchParams.get('search') || ''

    if (search && !/^[\p{L}\p{N}\s._-]*$/u.test(search)) {
      return NextResponse.json(
        { error: 'Parameter search mengandung karakter tidak valid' },
        { status: 400 }
      )
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('ipro')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.or(
        `"JENIS IPRO".ilike.%${search}%,"ALAMAT".ilike.%${search}%`
      )
    }

    const { data, count, error } = await query
      .order('id', { ascending: true })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req)
    if ('response' in auth) return auth.response

    const supabase = getSupabase()
    const body = await req.json()

    // Remove geom — compute from KOORDINAT if provided
    delete body.geom

    // Parse KOORDINAT field (format: "lat, lng" or "lat,lng")
    const koordinatStr = String(body['KOORDINAT'] || '').trim()
    if (koordinatStr) {
      const parts = koordinatStr.split(',').map((s: string) => parseFloat(s.trim()))
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const lat = parts[0]
        const lng = parts[1]
        body.geom = `SRID=4326;POINT(${lng} ${lat})`
      }
    }

    const { data, error } = await supabase
      .from('ipro')
      .insert(body)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
