import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { enviarMensagem } from '@/lib/uazapi'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { id } = await params
  const supabase = createSupabaseAdmin()

  const { data: lead, error: fetchErr } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchErr || !lead) {
    return NextResponse.json({ ok: false, message: 'Lead não encontrado' }, { status: 404 })
  }

  const { ok, resposta } = await enviarMensagem(lead.telefone, lead.nome ?? 'Advogado')

  await supabase
    .from('leads')
    .update({
      whatsapp_enviado: ok,
      whatsapp_enviado_em: ok ? new Date().toISOString() : null,
      erro_whatsapp: ok ? null : resposta,
    })
    .eq('id', id)

  await supabase.from('message_logs').insert({
    lead_id: id,
    telefone: lead.telefone,
    status: ok ? 'enviado' : 'erro',
    resposta_api: resposta,
  })

  return NextResponse.json({
    ok,
    message: ok ? 'WhatsApp enviado com sucesso!' : `Erro ao enviar: ${resposta}`,
  })
}
