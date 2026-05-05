import { createSupabaseAdmin } from './supabase'

export async function getSetting(key: string, fallback?: string): Promise<string | undefined> {
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .single()
    return data?.value ?? fallback
  } catch {
    return fallback
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const supabase = createSupabaseAdmin()
    const { data } = await supabase.from('app_settings').select('key, value')
    if (!data) return {}
    return Object.fromEntries(data.map(({ key, value }: { key: string; value: string }) => [key, value ?? '']))
  } catch {
    return {}
  }
}
