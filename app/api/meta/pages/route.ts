import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSetting } from '@/lib/settings'
import { fetchUserPages } from '@/lib/meta'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'META_ACCESS_TOKEN não configurado. Salve o token primeiro.' },
      { status: 400 }
    )
  }

  try {
    const pages = await fetchUserPages(token)
    return NextResponse.json({ ok: true, pages })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
