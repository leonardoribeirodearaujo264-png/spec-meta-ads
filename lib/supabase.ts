import { createClient } from '@supabase/supabase-js'

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    const msg = `[supabase] Missing required env var: ${key}`
    console.error(msg)
    throw new Error(msg)
  }
  return val
}

export function createSupabaseAdmin() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  )
}

export function createSupabaseClient() {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )
}
