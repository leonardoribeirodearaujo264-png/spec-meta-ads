import { createSupabasePublicClient } from '@/lib/supabase'
import { CheckCircle, XCircle, Users, MessageCircle, AlertCircle } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  whatsapp_enviado: boolean
  whatsapp_enviado_em: string | null
  erro_whatsapp: string | null
  created_at: string
}

async function getLeads(): Promise<Lead[]> {
  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao buscar leads:', error)
    return []
  }

  return data ?? []
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPhone(tel: string): string {
  if (!tel) return '—'
  const d = tel.replace(/\D/g, '')
  if (d.length === 13) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  }
  if (d.length === 12) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  }
  return tel
}

export const revalidate = 30

export default async function DashboardPage() {
  const leads = await getLeads()

  const total = leads.length
  const enviados = leads.filter((l) => l.whatsapp_enviado).length
  const erros = leads.filter((l) => !l.whatsapp_enviado && l.erro_whatsapp).length

  return (
    <main className="min-h-screen p-6 md:p-10" style={{ background: '#0A0F1E' }}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Advogado Dominante{' '}
          <span style={{ color: '#00D4FF' }}>— Leads</span>
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Captura automática via Meta Ads + Disparo WhatsApp
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<Users size={20} />}
          label="Total de Leads"
          value={total}
          color="#00D4FF"
        />
        <StatCard
          icon={<MessageCircle size={20} />}
          label="WhatsApp Enviado"
          value={enviados}
          color="#22c55e"
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          label="Pendentes / Erros"
          value={erros}
          color="#ef4444"
        />
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: '#1e2a3a', background: '#0d1526' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827', borderBottom: '1px solid #1e2a3a' }}>
                {['Nome', 'Telefone', 'Email', 'Recebido em', 'WhatsApp'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-slate-400 uppercase tracking-wider text-xs"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Nenhum lead capturado ainda.
                  </td>
                </tr>
              ) : (
                leads.map((lead, i) => (
                  <tr
                    key={lead.id}
                    className="border-t transition-colors"
                    style={{
                      borderColor: '#1e2a3a',
                      background: i % 2 === 0 ? 'transparent' : '#0b1220',
                    }}
                  >
                    <td className="px-4 py-3 text-white font-medium">{lead.nome || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{formatPhone(lead.telefone)}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      {lead.whatsapp_enviado ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-medium">
                          <CheckCircle size={15} />
                          Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 font-medium">
                          <XCircle size={15} />
                          {lead.erro_whatsapp ? 'Erro' : 'Pendente'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-slate-600 text-xs mt-4 text-center">
        Atualiza automaticamente a cada 30s &middot; {total} lead{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
      </p>
    </main>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) {
  return (
    <div
      className="rounded-xl p-5 border"
      style={{ background: '#0d1526', borderColor: '#1e2a3a' }}
    >
      <div className="flex items-center gap-2 mb-3" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
