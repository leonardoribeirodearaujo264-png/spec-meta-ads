import { createSupabaseAdmin } from '@/lib/supabase'
import { enviarMensagem } from '@/lib/uazapi'

// GET — Meta verifica o webhook aqui
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

// POST — Meta envia os dados do lead aqui
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const lead = body?.entry?.[0]?.changes?.[0]?.value?.leads?.[0]
    if (!lead) return new Response('OK', { status: 200 })

    const campos: Array<{ name: string; values: string[] }> = lead.field_data || []

    const nome =
      campos.find((f) => f.name === 'full_name')?.values?.[0] ?? 'Advogado'
    const telefone =
      campos.find((f) => f.name === 'phone_number')?.values?.[0] ?? ''
    const email =
      campos.find((f) => f.name === 'email')?.values?.[0] ?? ''

    const telefoneLimpo = telefone.replace(/\D/g, '')
    const telefoneFormatado = telefoneLimpo.startsWith('55')
      ? telefoneLimpo
      : `55${telefoneLimpo}`

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
      const sucesso = await enviarMensagem(telefoneFormatado, nome)
      await supabase
        .from('leads')
        .update({
          whatsapp_enviado: sucesso,
          whatsapp_enviado_em: sucesso ? new Date().toISOString() : null,
          erro_whatsapp: sucesso ? null : 'Falha no envio UazapiGO',
        })
        .eq('id', leadSalvo.id)
    }
  } catch (err) {
    console.error('Erro no webhook:', err)
  }

  return new Response('OK', { status: 200 })
}
