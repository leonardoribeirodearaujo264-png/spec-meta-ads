import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const allowed: Record<string, unknown> = {}
  if (typeof body.whatsapp_enviado === 'boolean') {
    allowed.whatsapp_enviado = body.whatsapp_enviado
    if (body.whatsapp_enviado) {
      allowed.whatsapp_enviado_em = new Date().toISOString()
      allowed.erro_whatsapp = null
    }
  }
  if (typeof body.erro_whatsapp === 'string') allowed.erro_whatsapp = body.erro_whatsapp

  const supabase = createSupabaseAdmin()
  const { error } = await supabase.from('leads').update(allowed).eq('id', id)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
