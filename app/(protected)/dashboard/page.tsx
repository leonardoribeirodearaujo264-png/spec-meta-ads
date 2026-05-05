'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Users, MessageCircle, AlertCircle, RefreshCw, Search } from 'lucide-react'

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

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function formatPhone(tel: string) {
  if (!tel) return '—'
  const d = tel.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  return tel
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [search, setSearch] = useState('')

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

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    return (
      l.nome?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.telefone?.includes(q)
    )
  })

  const total = leads.length
  const enviados = leads.filter((l) => l.whatsapp_enviado).length
  const erros = leads.filter((l) => !l.whatsapp_enviado && l.erro_whatsapp).length

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Leads Capturados</h1>
          <p className="text-slate-400 text-sm mt-0.5">Meta Ads → WhatsApp automático</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchLeads() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#1e2a3a', color: '#00D4FF' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Card icon={<Users size={18} />} label="Total de Leads" value={total} color="#00D4FF" />
        <Card icon={<MessageCircle size={18} />} label="WhatsApp Enviado" value={enviados} color="#22c55e" />
        <Card icon={<AlertCircle size={18} />} label="Erros / Pendentes" value={erros} color="#ef4444" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
          style={{ background: '#0d1526', border: '1px solid #1e2a3a' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#1e2a3a', background: '#0d1526' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#111827', borderBottom: '1px solid #1e2a3a' }}>
                {['Nome', 'Telefone', 'E-mail', 'Recebido em', 'WhatsApp'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  {search ? 'Nenhum resultado para a busca.' : 'Nenhum lead capturado ainda.'}
                </td></tr>
              ) : (
                filtered.map((lead, i) => (
                  <tr key={lead.id} className="border-t" style={{ borderColor: '#1e2a3a', background: i % 2 === 0 ? 'transparent' : '#0b1220' }}>
                    <td className="px-4 py-3 text-white font-medium">{lead.nome || '—'}</td>
                    <td className="px-4 py-3 text-slate-300">{formatPhone(lead.telefone)}</td>
                    <td className="px-4 py-3 text-slate-300">{lead.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      {lead.whatsapp_enviado ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-medium text-xs">
                          <CheckCircle size={13} /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-red-400 font-medium text-xs">
                          <XCircle size={13} /> {lead.erro_whatsapp ? 'Erro' : 'Pendente'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer da tabela */}
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#1e2a3a' }}>
          <p className="text-slate-600 text-xs">
            {filtered.length} de {total} lead{total !== 1 ? 's' : ''}
          </p>
          <p className="text-slate-600 text-xs">
            {lastUpdate ? `Atualizado às ${lastUpdate.toLocaleTimeString('pt-BR')}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

function Card({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl p-4 border" style={{ background: '#0d1526', borderColor: '#1e2a3a' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
