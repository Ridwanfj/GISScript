import { getSupabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

type AdminAuthResult = { user: User } | { response: NextResponse }

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('authorization') ?? ''

  if (!authHeader.startsWith('Bearer ')) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const token = authHeader.slice(7).trim()
  if (!token) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.auth.getUser(token)
  const user = data.user

  if (error || !user) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  // Default: Disable strict role check temporarily so any authenticated user can access.
  // Uncomment the lines below if you want to strictly limit this to users with { role: 'admin' } in their user_metadata.
  /*
  const role = user.app_metadata?.role ?? user.user_metadata?.role
  if (!role || role !== 'admin') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  */

  return { user }
}
