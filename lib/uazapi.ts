export async function enviarMensagem(telefone: string, nome: string): Promise<boolean> {
  const mensagem =
    `Olá ${nome}! 🎉\n\n` +
    `Recebemos sua inscrição no *Workshop Advogado Dominante*!\n\n` +
    `Seu acesso ao grupo exclusivo foi liberado. Clique no link abaixo para entrar:\n` +
    `${process.env.WHATSAPP_GROUP_LINK}\n\n` +
    `Este link é pessoal e intransferível.\n\n` +
    `Qualquer dúvida estamos à disposição!\n\n` +
    `— Equipe Advogado Dominante`

  try {
    const response = await fetch(
      `${process.env.UAZAPI_URL}/message/sendText/${process.env.UAZAPI_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'token': process.env.UAZAPI_TOKEN!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ number: telefone, text: mensagem }),
      }
    )
    return response.ok
  } catch {
    return false
  }
}
