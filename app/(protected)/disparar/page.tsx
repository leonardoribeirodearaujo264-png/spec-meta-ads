'use client'

import { useEffect, useState, useCallback } from 'react'
import { Send, RefreshCw, CheckCircle, XCircle, Square, CheckSquare } from 'lucide-react'

interface Lead {
  id: string
  nome: string
  telefone: string
  email: string
  whatsapp_enviado: boolean
  erro_whatsapp: string | null
}

interface SendResult {
  id: string
  nome: string
  telefone: string
  ok: boolean
  message: string
}

const DEFAULT_MSG =
  `Olá {nome}! 🎉\n\nRecebemos sua inscrição no *Workshop Advogado Dominante*!\n\nSeu acesso ao grupo exclusivo foi liberado. Clique no link abaixo para entrar:\n{link}\n\nEste link é pessoal e intransferível.\n\nQualquer dúvida estamos à disposição!\n\n— Equipe Advogado Dominante`

export default function DispararPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState(DEFAULT_MSG)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<SendResult[]>([])
  const [filterPending, setFilterPending] = useState(true)

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads', { cache: 'no-store' })
      const json = await res.json()
      const all: Lead[] = json.leads ?? []
      setLeads(all)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const visibleLeads = filterPending
    ? leads.filter((l) => !l.whatsapp_enviado)
    : leads

  function toggleAll() {
    if (selected.size === visibleLeads.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(visibleLeads.map((l) => l.id)))
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleEnviar() {
    if (selected.size === 0) return
    setSending(true)
    setResults([])
    try {
      const res = await fetch('/api/disparar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_ids: Array.from(selected), message }),
      })
      const json = await res.json()
      setResults(json.results ?? [])
      setSelected(new Set())
      await fetchLeads()
    } finally {
      setSending(false)
    }
  }

  const allSelected = visibleLeads.length > 0 && selected.size === visibleLeads.length

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Disparar Mensagem</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Envie WhatsApp para leads selecionados</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selecionar leads */}
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-white">Selecionar leads</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterPending(!filterPending)}
                className="px-3 py-1 rounded text-xs font-medium"
                style={{
                  background: filterPending ? '#2A1F5C' : '#13102A',
                  color: filterPending ? '#8B5CF6' : '#9B8EC4',
                  border: '1px solid #2A1F5C',
                }}
              >
                {filterPending ? 'Pendentes' : 'Todos'}
              </button>
              <button
                onClick={() => { setLoading(true); fetchLeads() }}
                className="px-2 py-1 rounded"
                style={{ background: '#13102A', color: '#9B8EC4', border: '1px solid #2A1F5C' }}
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2A1F5C', background: '#13102A' }}>
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: '#100D26', borderColor: '#2A1F5C' }}>
              <button onClick={toggleAll} style={{ color: allSelected ? '#8B5CF6' : '#9B8EC4' }}>
                {allSelected ? <CheckSquare size={15} /> : <Square size={15} />}
              </button>
              <span className="text-xs" style={{ color: '#9B8EC4' }}>
                {selected.size} selecionado{selected.size !== 1 ? 's' : ''} de {visibleLeads.length}
              </span>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {loading ? (
                <p className="px-4 py-6 text-center text-sm" style={{ color: '#9B8EC4' }}>Carregando...</p>
              ) : visibleLeads.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm" style={{ color: '#9B8EC4' }}>
                  {filterPending ? 'Nenhum lead pendente.' : 'Nenhum lead.'}
                </p>
              ) : visibleLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => toggle(lead.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b text-left transition-colors hover:bg-white/5"
                  style={{ borderColor: '#2A1F5C' }}
                >
                  <span style={{ color: selected.has(lead.id) ? '#8B5CF6' : '#9B8EC4', flexShrink: 0 }}>
                    {selected.has(lead.id) ? <CheckSquare size={15} /> : <Square size={15} />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{lead.nome || '—'}</p>
                    <p className="text-xs truncate" style={{ color: '#9B8EC4' }}>{lead.telefone} · {lead.email || 'sem e-mail'}</p>
                  </div>
                  <span className="text-xs" style={{ color: lead.whatsapp_enviado ? '#22c55e' : lead.erro_whatsapp ? '#ef4444' : '#f59e0b', flexShrink: 0 }}>
                    {lead.whatsapp_enviado ? 'enviado' : lead.erro_whatsapp ? 'erro' : 'pendente'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mensagem + Enviar */}
        <div>
          <h2 className="text-sm font-semibold text-white mb-3">Mensagem</h2>
          <div className="rounded-xl border p-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
            <p className="text-xs mb-2" style={{ color: '#9B8EC4' }}>
              Use <code style={{ color: '#8B5CF6' }}>{'{nome}'}</code> e <code style={{ color: '#8B5CF6' }}>{'{link}'}</code> como variáveis dinâmicas.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full rounded-lg p-3 text-sm text-white outline-none resize-none"
              style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
            />
            <button
              onClick={handleEnviar}
              disabled={sending || selected.size === 0}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#8B5CF6', color: '#fff' }}
            >
              {sending ? (
                <><RefreshCw size={14} className="animate-spin" /> Enviando...</>
              ) : (
                <><Send size={14} /> Enviar para {selected.size} lead{selected.size !== 1 ? 's' : ''}</>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-white mb-2">Resultado do envio</h3>
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2A1F5C', background: '#13102A' }}>
                {results.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ borderColor: '#2A1F5C' }}>
                    {r.ok
                      ? <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
                      : <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{r.nome}</p>
                      <p className="text-xs truncate" style={{ color: '#9B8EC4' }}>{r.message}</p>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2.5 text-xs" style={{ color: '#9B8EC4' }}>
                  {results.filter((r) => r.ok).length} enviados · {results.filter((r) => !r.ok).length} erros
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
