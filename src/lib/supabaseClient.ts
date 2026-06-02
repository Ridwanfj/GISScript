import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client (singleton)
// Digunakan untuk auth dan operasi client-side di halaman admin
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
