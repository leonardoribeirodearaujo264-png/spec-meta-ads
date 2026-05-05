import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { enviarMensagem } from '@/lib/uazapi'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const body = await request.json()
  const lead_ids: string[] = body.lead_ids ?? []
  const customMessage: string | undefined = body.message || undefined

  if (lead_ids.length === 0) {
    return NextResponse.json({ error: 'Nenhum lead selecionado' }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  const { data: leads, error } = await supabase
    .from('leads')
    .select('id, nome, telefone')
    .in('id', lead_ids)

  if (error || !leads) {
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
  }

  const results = []
  for (const lead of leads) {
    const { ok, resposta } = await enviarMensagem(lead.telefone, lead.nome ?? 'Advogado', customMessage)

    await supabase
      .from('leads')
      .update({
        whatsapp_enviado: ok,
        whatsapp_enviado_em: ok ? new Date().toISOString() : null,
        erro_whatsapp: ok ? null : resposta,
      })
      .eq('id', lead.id)

    await supabase.from('message_logs').insert({
      lead_id: lead.id,
      telefone: lead.telefone,
      mensagem: customMessage ?? null,
      status: ok ? 'enviado' : 'erro',
      resposta_api: resposta,
    })

    results.push({
      id: lead.id,
      nome: lead.nome ?? '—',
      telefone: lead.telefone,
      ok,
      message: ok ? 'Enviado com sucesso' : resposta,
    })
  }

  return NextResponse.json({ results })
}
