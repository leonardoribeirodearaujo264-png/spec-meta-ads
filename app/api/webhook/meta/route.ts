import { createSupabaseAdmin } from '@/lib/supabase'
import { getSetting } from '@/lib/settings'
import { enviarMensagem } from '@/lib/uazapi'

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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const lead = body?.entry?.[0]?.changes?.[0]?.value?.leads?.[0]
    if (!lead) return new Response('OK', { status: 200 })

    const campos: Array<{ name: string; values: string[] }> = lead.field_data || []

    const nome = campos.find((f) => f.name === 'full_name')?.values?.[0] ?? 'Advogado'
    const telefone = campos.find((f) => f.name === 'phone_number')?.values?.[0] ?? ''
    const email = campos.find((f) => f.name === 'email')?.values?.[0] ?? ''

    const telefoneLimpo = telefone.replace(/\D/g, '')
    const telefoneFormatado = telefoneLimpo.startsWith('55') ? telefoneLimpo : `55${telefoneLimpo}`

    const supabase = createSupabaseAdmin()

    const { data: leadSalvo, error } = await supabase
      .from('leads')
      .insert({ nome, telefone: telefoneFormatado, email })
      .select()
      .single()

    if (error || !leadSalvo) {
      console.error('Erro ao salvar lead:', error)
      return new Response('OK', { status: 200 })
    }

    if (telefoneFormatado.length >= 12) {
      const { ok, resposta } = await enviarMensagem(telefoneFormatado, nome)

      await supabase
        .from('leads')
        .update({
          whatsapp_enviado: ok,
          whatsapp_enviado_em: ok ? new Date().toISOString() : null,
          erro_whatsapp: ok ? null : resposta,
        })
        .eq('id', leadSalvo.id)

      await supabase.from('message_logs').insert({
        lead_id: leadSalvo.id,
        telefone: telefoneFormatado,
        status: ok ? 'enviado' : 'erro',
        resposta_api: resposta,
      })
    }
  } catch (err) {
    console.error('Erro no webhook:', err)
  }

  return new Response('OK', { status: 200 })
}
