import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSetting } from '@/lib/settings'
import { testMetaToken } from '@/lib/meta'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
  if (!token) {
    return NextResponse.json({
      ok: false,
      info: 'META_ACCESS_TOKEN não configurado. Adicione em Configurações.',
    })
  }

  const result = await testMetaToken(token)
  return NextResponse.json(result)
}
