'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, MessageCircle, AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react'

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

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' })
      const json = await res.json()
      setLeads(json.leads ?? [])
      setLastUpdate(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
    const t = setInterval(fetchLeads, 30_000)
    return () => clearInterval(t)
  }, [fetchLeads])

  const total = leads.length
  const enviados = leads.filter((l) => l.whatsapp_enviado).length
  const pendentes = leads.filter((l) => !l.whatsapp_enviado && !l.erro_whatsapp).length
  const erros = leads.filter((l) => !l.whatsapp_enviado && l.erro_whatsapp).length
  const recentes = leads.slice(0, 8)

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Visão geral dos leads capturados</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchLeads() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#2A1F5C', color: '#8B5CF6' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<Users size={18} />} label="Total de Leads" value={total} color="#8B5CF6" />
        <StatCard icon={<MessageCircle size={18} />} label="WhatsApp Enviado" value={enviados} color="#22c55e" />
        <StatCard icon={<AlertCircle size={18} />} label="Pendentes" value={pendentes} color="#f59e0b" />
        <StatCard icon={<AlertCircle size={18} />} label="Erros" value={erros} color="#ef4444" />
      </div>

      {/* Recent leads */}
      <div>
        <h2 className="text-base font-semibold text-white mb-3">Últimos leads recebidos</h2>
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#2A1F5C', background: '#13102A' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#100D26', borderBottom: '1px solid #2A1F5C' }}>
                  {['Nome', 'Telefone', 'E-mail', 'Recebido em', 'WhatsApp'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#9B8EC4' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && recentes.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>Carregando...</td></tr>
                ) : recentes.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>Nenhum lead ainda.</td></tr>
                ) : recentes.map((lead, i) => (
                  <tr key={lead.id} className="border-t" style={{ borderColor: '#2A1F5C', background: i % 2 === 0 ? 'transparent' : '#100D26' }}>
                    <td className="px-4 py-3 text-white font-medium">{lead.nome || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#9B8EC4' }}>{lead.telefone || '—'}</td>
                    <td className="px-4 py-3" style={{ color: '#9B8EC4' }}>{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{fmt(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      {lead.whatsapp_enviado ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                          <CheckCircle size={13} /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: lead.erro_whatsapp ? '#ef4444' : '#f59e0b' }}>
                          <XCircle size={13} /> {lead.erro_whatsapp ? 'Erro' : 'Pendente'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#2A1F5C' }}>
            <p className="text-xs" style={{ color: '#6B5FA0' }}>Exibindo {recentes.length} de {total} leads</p>
            <p className="text-xs" style={{ color: '#6B5FA0' }}>
              {lastUpdate ? `Atualizado às ${lastUpdate.toLocaleTimeString('pt-BR')}` : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#9B8EC4' }}>{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
