import { createSupabaseAdmin } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'
import { enviarMensagem } from '@/lib/uazapi'
import { fetchSingleLead, extractLeadFields } from '@/lib/meta'

// GET — Meta verifica o webhook aqui
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = await getSetting('WEBHOOK_VERIFY_TOKEN', process.env.WEBHOOK_VERIFY_TOKEN)
  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// POST — Meta notifica novos leads aqui
// Payload real: { entry: [{ changes: [{ field: 'leadgen', value: { leadgen_id, form_id, page_id } }] }] }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const changes: Array<{ field: string; value: Record<string, string> }> =
      body?.entry?.[0]?.changes ?? []

    for (const change of changes) {
      if (change.field !== 'leadgen') continue

      const { leadgen_id, form_id } = change.value ?? {}
      if (!leadgen_id) continue

      const accessToken = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
      if (!accessToken) {
        console.error('[webhook] META_ACCESS_TOKEN não configurado — configure em Configurações')
        continue
      }

      // Buscar dados completos do lead na Graph API
      const metaLead = await fetchSingleLead(leadgen_id, accessToken)
      if (!metaLead) {
        console.error('[webhook] Não foi possível buscar lead_id:', leadgen_id)
        continue
      }

      const supabase = createSupabaseAdmin()

      // Evitar duplicata
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('facebook_lead_id', leadgen_id)
        .maybeSingle()

      if (existing) continue

      const { nome, email, telefone } = extractLeadFields(metaLead.field_data)

      const { data: leadSalvo, error } = await supabase
        .from('leads')
        .insert({
          nome: nome || 'Sem nome',
          email: email || null,
          telefone: telefone || null,
          facebook_lead_id: leadgen_id,
          form_id: form_id ?? metaLead.form_id ?? null,
          whatsapp_enviado: false,
          created_at: metaLead.created_time
            ? new Date(metaLead.created_time).toISOString()
            : new Date().toISOString(),
        })
        .select()
        .single()

      if (error || !leadSalvo) {
        console.error('[webhook] Erro ao salvar lead:', error)
        continue
      }

      // Enviar WhatsApp se tiver telefone válido
      if (telefone && telefone.length >= 12) {
        const { ok, resposta } = await enviarMensagem(telefone, nome || 'Advogado')

        await supabase.from('leads').update({
          whatsapp_enviado: ok,
          whatsapp_enviado_em: ok ? new Date().toISOString() : null,
          erro_whatsapp: ok ? null : resposta,
        }).eq('id', leadSalvo.id)

        try {
          await supabase.from('message_logs').insert({
            lead_id: leadSalvo.id,
            telefone,
            status: ok ? 'enviado' : 'erro',
            resposta_api: resposta,
          })
        } catch { /* log não crítico */ }
      }
    }
  } catch (err) {
    console.error('[webhook] Erro inesperado:', err)
  }

  return new Response('OK', { status: 200 })
}
