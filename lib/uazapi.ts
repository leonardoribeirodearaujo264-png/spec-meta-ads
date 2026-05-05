import { getSetting } from './settings'

const DEFAULT_TEMPLATE =
  `Olá {nome}! 🎉\n\n` +
  `Recebemos sua inscrição no *Workshop Advogado Dominante*!\n\n` +
  `Seu acesso ao grupo exclusivo foi liberado. Clique no link abaixo para entrar:\n` +
  `{link}\n\n` +
  `Este link é pessoal e intransferível.\n\n` +
  `Qualquer dúvida estamos à disposição!\n\n` +
  `— Equipe Advogado Dominante`

export async function enviarMensagem(
  telefone: string,
  nome: string,
  customMessage?: string
): Promise<{ ok: boolean; resposta: string }> {
  const baseUrl = await getSetting('UAZAPI_URL', process.env.UAZAPI_URL)
  const instance = await getSetting('UAZAPI_INSTANCE', process.env.UAZAPI_INSTANCE)
  const token = await getSetting('UAZAPI_TOKEN', process.env.UAZAPI_TOKEN)
  const groupLink = await getSetting('WHATSAPP_GROUP_LINK', process.env.WHATSAPP_GROUP_LINK) ?? ''
  const template = customMessage ?? (await getSetting('DEFAULT_MESSAGE')) ?? DEFAULT_TEMPLATE

  if (!baseUrl || !instance || !token) {
    const resposta = '[uazapi] Configuração incompleta: UAZAPI_URL, UAZAPI_INSTANCE ou UAZAPI_TOKEN ausentes'
    console.error(resposta)
    return { ok: false, resposta }
  }

  const mensagem = template.replace(/\{nome\}/g, nome).replace(/\{link\}/g, groupLink)

  try {
    const response = await fetch(`${baseUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: { token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: telefone, text: mensagem }),
    })
    const resposta = await response.text()
    return { ok: response.ok, resposta }
  } catch (err) {
    return { ok: false, resposta: String(err) }
  }
}
