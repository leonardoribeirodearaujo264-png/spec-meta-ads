import { createSupabaseAdmin } from './supabase'
import { getSetting } from './settings'
import { fetchLeadsFromForm, extractLeadFields } from './meta'
import { enviarMensagem } from './uazapi'

export interface SyncResult {
  ok: boolean
  total?: number
  importados?: number
  ignorados?: number
  enviados?: number
  erros?: { facebook_lead_id: string; error: string }[]
  error?: string
}

export async function syncMetaLeads(): Promise<SyncResult> {
  const supabase = createSupabaseAdmin()
  const token = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
  const formId = await getSetting('META_FORM_ID', process.env.META_FORM_ID)

  if (!token) return { ok: false, error: 'META_ACCESS_TOKEN não configurado. Vá em Configurações e adicione o token de acesso da Meta.' }
  if (!formId) return { ok: false, error: 'META_FORM_ID não configurado. Vá em Configurações e informe o ID do formulário de leads.' }

  let metaLeads
  try {
    metaLeads = await fetchLeadsFromForm(formId, token)
  } catch (err) {
    const errMsg = String(err)
    try {
      await supabase.from('message_logs').insert({
        telefone: '[sync-meta]',
        status: 'erro',
        resposta_api: errMsg,
      })
    } catch { /* log não crítico */ }
    return { ok: false, error: errMsg }
  }

  let importados = 0
  let ignorados = 0
  let enviados = 0
  const erros: { facebook_lead_id: string; error: string }[] = []

  for (const metaLead of metaLeads) {
    try {
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('facebook_lead_id', metaLead.id)
        .maybeSingle()

      if (existing) { ignorados++; continue }

      const { nome, email, telefone } = extractLeadFields(metaLead.field_data)

      const { data: leadSalvo, error: insertErr } = await supabase
        .from('leads')
        .insert({
          nome: nome || 'Sem nome',
          email: email || null,
          telefone: telefone || null,
          facebook_lead_id: metaLead.id,
          form_id: formId,
          whatsapp_enviado: false,
          created_at: metaLead.created_time
            ? new Date(metaLead.created_time).toISOString()
            : new Date().toISOString(),
        })
        .select()
        .single()

      if (insertErr || !leadSalvo) {
        erros.push({ facebook_lead_id: metaLead.id, error: insertErr?.message ?? 'unknown' })
        continue
      }

      importados++

      if (telefone && telefone.length >= 12) {
        const { ok, resposta } = await enviarMensagem(telefone, nome || 'Advogado')

        await supabase
          .from('leads')
          .update({
            whatsapp_enviado: ok,
            whatsapp_enviado_em: ok ? new Date().toISOString() : null,
            erro_whatsapp: ok ? null : resposta,
          })
          .eq('id', leadSalvo.id)

        try {
          await supabase.from('message_logs').insert({
            lead_id: leadSalvo.id,
            telefone,
            status: ok ? 'enviado' : 'erro',
            resposta_api: resposta,
          })
        } catch { /* log não crítico */ }

        if (ok) enviados++
      }
    } catch (err) {
      erros.push({ facebook_lead_id: metaLead.id, error: String(err) })
    }
  }

  try {
    await supabase.from('message_logs').insert({
      telefone: '[sync-meta]',
      status: erros.length > 0 && importados === 0 ? 'erro' : 'enviado',
      resposta_api: JSON.stringify({
        form_id: formId,
        total_meta: metaLeads.length,
        importados,
        ignorados_duplicados: ignorados,
        enviados_whatsapp: enviados,
        erros: erros.slice(0, 5),
      }),
    })
  } catch { /* log não crítico */ }

  return {
    ok: true,
    total: metaLeads.length,
    importados,
    ignorados,
    enviados,
    erros: erros.slice(0, 10),
  }
}
