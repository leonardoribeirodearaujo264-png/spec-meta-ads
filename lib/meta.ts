export interface MetaLeadField {
  name: string
  values: string[]
}

export interface MetaLead {
  id: string
  field_data: MetaLeadField[]
  created_time: string
  form_id?: string
}

export interface MetaForm {
  id: string
  name: string
  status: string
  leads_count?: number
}

function getField(fields: MetaLeadField[], ...names: string[]): string {
  for (const name of names) {
    const found = fields.find(
      (f) => f.name === name || f.name.toLowerCase().replace(/[_\s-]/g, '').includes(name.replace(/[_\s-]/g, ''))
    )
    if (found?.values?.[0]) return found.values[0]
  }
  return ''
}

export function extractLeadFields(fieldData: MetaLeadField[]) {
  const nome = getField(fieldData, 'full_name', 'nome', 'name', 'first_name', 'fullname')
  const telefone = getField(fieldData, 'phone_number', 'telefone', 'whatsapp', 'phone', 'celular', 'phonenumber')
  const email = getField(fieldData, 'email', 'e-mail', 'email_address')

  const telefoneLimpo = telefone.replace(/\D/g, '')
  const telefoneFormatado = telefoneLimpo
    ? telefoneLimpo.startsWith('55') ? telefoneLimpo : `55${telefoneLimpo}`
    : ''

  return { nome, email, telefone: telefoneFormatado }
}

export async function fetchLeadsFromForm(formId: string, accessToken: string): Promise<MetaLead[]> {
  const leads: MetaLead[] = []
  const base = `https://graph.facebook.com/v20.0/${formId}/leads?fields=id,field_data,created_time&limit=100&access_token=${encodeURIComponent(accessToken)}`
  let nextUrl: string = base

  while (nextUrl) {
    const target: string = nextUrl
    const res: Response = await fetch(target)
    const json: Record<string, unknown> = (await res.json()) as Record<string, unknown>
    if (json.error) {
      const err = json.error as { message: string; code: number }
      throw new Error(`Meta API: ${err.message} (código ${err.code})`)
    }
    leads.push(...((json.data as MetaLead[]) ?? []))
    const paging = json.paging as { next?: string } | undefined
    nextUrl = paging?.next ?? ''
  }

  return leads
}

export async function fetchSingleLead(leadId: string, accessToken: string): Promise<MetaLead | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${leadId}?fields=id,field_data,created_time,form_id&access_token=${encodeURIComponent(accessToken)}`
    )
    const json = await res.json()
    if (json.error) {
      console.error('[meta] fetchSingleLead:', json.error.message)
      return null
    }
    return json as MetaLead
  } catch {
    return null
  }
}

export async function fetchFormsFromPage(pageId: string, accessToken: string): Promise<MetaForm[]> {
  const res = await fetch(
    `https://graph.facebook.com/v20.0/${pageId}/leadgen_forms?fields=id,name,status,leads_count&access_token=${encodeURIComponent(accessToken)}`
  )
  const json = await res.json()
  if (json.error) throw new Error(`Meta API: ${json.error.message}`)
  return json.data ?? []
}

export async function testMetaToken(accessToken: string): Promise<{ ok: boolean; info: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`
    )
    const json = await res.json()
    if (json.error) return { ok: false, info: `Erro: ${json.error.message}` }
    return { ok: true, info: `Token válido — Conta: ${json.name ?? json.id}` }
  } catch (e) {
    return { ok: false, info: `Falha de rede: ${String(e)}` }
  }
}
