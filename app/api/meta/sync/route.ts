import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getSetting } from '@/lib/settings'
import { fetchLeadsFromForm, extractLeadFields } from '@/lib/meta'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const token = await getSetting('META_ACCESS_TOKEN', process.env.META_ACCESS_TOKEN)
  const formId = await getSetting('META_FORM_ID', process.env.META_FORM_ID)

  if (!token) {
    return NextResponse.json({
      ok: false,
      error: 'META_ACCESS_TOKEN não configurado. Vá em Configurações e adicione o token de acesso da Meta.',
    }, { status: 400 })
  }

  if (!formId) {
    return NextResponse.json({
      ok: false,
      error: 'META_FORM_ID não configurado. Vá em Configurações e informe o ID do formulário de leads.',
    }, { status: 400 })
  }

  const supabase = createSupabaseAdmin()
  let metaLeads
  try {
    metaLeads = await fetchLeadsFromForm(formId, token)
  } catch (err) {
    const errMsg = String(err)
    try {
      await supabase.from('message_logs').insert({
        telefone: '[sincronizacao-meta]',
        status: 'erro',
        resposta_api: errMsg,
      })
    } catch { /* log não crítico */ }
    return NextResponse.json({ ok: false, error: errMsg }, { status: 500 })
  }

  let importados = 0
  let ignorados = 0
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

      const { error: insertErr } = await supabase.from('leads').insert({
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

      if (insertErr) {
        erros.push({ facebook_lead_id: metaLead.id, error: insertErr.message })
      } else {
        importados++
      }
    } catch (err) {
      erros.push({ facebook_lead_id: metaLead.id, error: String(err) })
    }
  }

  try {
    await supabase.from('message_logs').insert({
      telefone: '[sincronizacao-meta]',
      status: erros.length > 0 && importados === 0 ? 'erro' : 'enviado',
      resposta_api: JSON.stringify({
        form_id: formId,
        total_meta: metaLeads.length,
        importados,
        ignorados_duplicados: ignorados,
        erros: erros.slice(0, 5),
      }),
    })
  } catch { /* log não crítico */ }

  return NextResponse.json({
    ok: true,
    total: metaLeads.length,
    importados,
    ignorados,
    erros: erros.slice(0, 10),
  })
}
