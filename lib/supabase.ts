import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Usado no servidor (webhook, dashboard) — ignora RLS
export function createSupabaseAdmin() {
  return createClient(url, serviceKey)
}

// Usado no cliente — sujeito a RLS
export function createSupabaseClient() {
  return createClient(url, anonKey)
}
