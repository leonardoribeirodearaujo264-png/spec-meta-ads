'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CheckCircle, XCircle, RefreshCw, Search, RotateCcw, CheckSquare,
} from 'lucide-react'

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

type Filter = 'todos' | 'enviados' | 'pendentes' | 'erro'

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtPhone(tel: string) {
  if (!tel) return '—'
  const d = tel.replace(/\D/g, '')
  if (d.length === 13) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`
  if (d.length === 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`
  return tel
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('todos')
  const [sending, setSending] = useState<string | null>(null)
  const [marking, setMarking] = useState<string | null>(null)
  const [toast, setToast] = useState<{ id: string; msg: string; ok: boolean } | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' })
      const json = await res.json()
      setLeads(json.leads ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  function showToast(id: string, msg: string, ok: boolean) {
    setToast({ id, msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  async function reenviar(lead: Lead) {
    setSending(lead.id)
    try {
      const res = await fetch(`/api/leads/${lead.id}/reenviar`, { method: 'POST' })
      const json = await res.json()
      showToast(lead.id, json.message ?? (json.ok ? 'Enviado!' : 'Erro ao enviar'), json.ok)
      await fetchLeads()
    } finally {
      setSending(null)
    }
  }

  async function marcarEnviado(lead: Lead) {
    setMarking(lead.id)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp_enviado: true }),
      })
      const json = await res.json()
      showToast(lead.id, json.ok ? 'Marcado como enviado!' : 'Erro ao marcar', json.ok ?? false)
      await fetchLeads()
    } finally {
      setMarking(null)
    }
  }

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      l.nome?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.telefone?.includes(q)
    const matchFilter =
      filter === 'todos' ||
      (filter === 'enviados' && l.whatsapp_enviado) ||
      (filter === 'pendentes' && !l.whatsapp_enviado && !l.erro_whatsapp) ||
      (filter === 'erro' && !l.whatsapp_enviado && !!l.erro_whatsapp)
    return matchSearch && matchFilter
  })

  const counts = {
    todos: leads.length,
    enviados: leads.filter((l) => l.whatsapp_enviado).length,
    pendentes: leads.filter((l) => !l.whatsapp_enviado && !l.erro_whatsapp).length,
    erro: leads.filter((l) => !l.whatsapp_enviado && !!l.erro_whatsapp).length,
  }

  const FILTERS: { key: Filter; label: string; color: string }[] = [
    { key: 'todos', label: `Todos (${counts.todos})`, color: '#8B5CF6' },
    { key: 'enviados', label: `Enviados (${counts.enviados})`, color: '#22c55e' },
    { key: 'pendentes', label: `Pendentes (${counts.pendentes})`, color: '#f59e0b' },
    { key: 'erro', label: `Erro (${counts.erro})`, color: '#ef4444' },
  ]

  return (
    <div className="p-6 md:p-8">
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg"
          style={{ background: toast.ok ? '#14532d' : '#450a0a', color: toast.ok ? '#86efac' : '#fca5a5', border: `1px solid ${toast.ok ? '#166534' : '#7f1d1d'}` }}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Lista completa de leads capturados</p>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === key ? color + '22' : '#13102A',
              color: filter === key ? color : '#9B8EC4',
              border: `1px solid ${filter === key ? color + '66' : '#2A1F5C'}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9B8EC4' }} />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm text-white outline-none"
          style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
        />
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#2A1F5C', background: '#13102A' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#100D26', borderBottom: '1px solid #2A1F5C' }}>
                {['Nome', 'Telefone', 'E-mail', 'Recebido em', 'WhatsApp', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#9B8EC4' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>
                  {search || filter !== 'todos' ? 'Nenhum resultado.' : 'Nenhum lead ainda.'}
                </td></tr>
              ) : filtered.map((lead, i) => (
                <tr key={lead.id} className="border-t" style={{ borderColor: '#2A1F5C', background: i % 2 === 0 ? 'transparent' : '#100D26' }}>
                  <td className="px-4 py-3 text-white font-medium">{lead.nome || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{fmtPhone(lead.telefone)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{lead.email || '—'}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{fmt(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    {lead.whatsapp_enviado ? (
                      <span className="flex items-center gap-1 text-green-400 text-xs font-medium">
                        <CheckCircle size={12} /> Enviado<br />
                        <span className="text-xs opacity-60 ml-1">{fmt(lead.whatsapp_enviado_em)}</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: lead.erro_whatsapp ? '#ef4444' : '#f59e0b' }}>
                        <XCircle size={12} /> {lead.erro_whatsapp ? 'Erro' : 'Pendente'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reenviar(lead)}
                        disabled={sending === lead.id}
                        title="Reenviar WhatsApp"
                        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-opacity disabled:opacity-50"
                        style={{ background: '#2A1F5C', color: '#8B5CF6' }}
                      >
                        <RotateCcw size={11} className={sending === lead.id ? 'animate-spin' : ''} />
                        Reenviar
                      </button>
                      {!lead.whatsapp_enviado && (
                        <button
                          onClick={() => marcarEnviado(lead)}
                          disabled={marking === lead.id}
                          title="Marcar como enviado"
                          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-opacity disabled:opacity-50"
                          style={{ background: '#14532d', color: '#86efac' }}
                        >
                          <CheckSquare size={11} />
                          Marcar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: '#2A1F5C' }}>
          <p className="text-xs" style={{ color: '#6B5FA0' }}>{filtered.length} de {leads.length} leads</p>
        </div>
      </div>
    </div>
  )
}
