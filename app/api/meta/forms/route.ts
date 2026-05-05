import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSetting } from '@/lib/settings'
import { fetchFormsFromPage } from '@/lib/meta'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
  const pageId = await getSetting('META_PAGE_ID', process.env.META_PAGE_ID)

  if (!token || !pageId) {
    return NextResponse.json({
      ok: false,
      error: 'Configure META_ACCESS_TOKEN e META_PAGE_ID em Configurações antes de buscar formulários.',
    }, { status: 400 })
  }

  try {
    const forms = await fetchFormsFromPage(pageId, token)
    return NextResponse.json({ ok: true, forms })
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
