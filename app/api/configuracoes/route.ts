import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

const ENV_KEYS: Array<[string, string | undefined]> = [
  ['META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN],
  ['META_PAGE_ID', process.env.META_PAGE_ID],
  ['META_FORM_ID', process.env.META_FORM_ID],
  ['META_APP_ID', process.env.META_APP_ID],
  ['WEBHOOK_VERIFY_TOKEN', process.env.WEBHOOK_VERIFY_TOKEN],
  ['UAZAPI_URL', process.env.UAZAPI_URL],
  ['UAZAPI_TOKEN', process.env.UAZAPI_TOKEN],
  ['UAZAPI_INSTANCE', process.env.UAZAPI_INSTANCE],
  ['WHATSAPP_GROUP_LINK', process.env.WHATSAPP_GROUP_LINK],
]

export async function GET() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseAdmin()
  const { data } = await supabase.from('app_settings').select('key, value')
  const settings: Record<string, string> = {}
  if (data) data.forEach(({ key, value }: { key: string; value: string }) => { settings[key] = value ?? '' })

  // Fill missing keys from ENV vars so fields appear pre-populated
  for (const [key, val] of ENV_KEYS) {
    if (!settings[key] && val) settings[key] = val
  }

  return NextResponse.json({ settings })
}

export async function POST(request: Request) {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const incoming: Record<string, string> = body.settings ?? {}

  const rows = Object.entries(incoming)
    .filter(([key]) => key.trim() !== '')
    .map(([key, value]) => ({
      key,
      value: String(value ?? ''),
      updated_at: new Date().toISOString(),
    }))

  if (rows.length === 0) return NextResponse.json({ ok: true })

  const supabase = createSupabaseAdmin()
  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' })

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
