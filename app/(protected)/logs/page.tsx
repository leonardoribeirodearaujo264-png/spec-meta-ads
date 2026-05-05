'use client'

import { useEffect, useState, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

interface Log {
  id: string
  lead_id: string | null
  telefone: string
  mensagem: string | null
  status: string
  resposta_api: string | null
  created_at: string
  leads?: { nome: string; email: string } | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs', { cache: 'no-store' })
      const json = await res.json()
      setLogs(json.logs ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const enviados = logs.filter((l) => l.status === 'enviado').length
  const erros = logs.filter((l) => l.status === 'erro').length

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Logs de Envio</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Histórico completo de mensagens disparadas</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchLogs() }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: '#2A1F5C', color: '#8B5CF6' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: logs.length, color: '#8B5CF6' },
          { label: 'Enviados', value: enviados, color: '#22c55e' },
          { label: 'Erros', value: erros, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border p-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#9B8EC4' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Logs table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#2A1F5C', background: '#13102A' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#100D26', borderBottom: '1px solid #2A1F5C' }}>
                {['Status', 'Lead', 'Telefone', 'Data/Hora', 'Resposta API'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: '#9B8EC4' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: '#9B8EC4' }}>Nenhum log registrado ainda.</td></tr>
              ) : logs.map((log, i) => (
                <>
                  <tr
                    key={log.id}
                    className="border-t cursor-pointer hover:bg-white/5"
                    style={{ borderColor: '#2A1F5C', background: i % 2 === 0 ? 'transparent' : '#100D26' }}
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  >
                    <td className="px-4 py-3">
                      {log.status === 'enviado' ? (
                        <span className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                          <CheckCircle size={12} /> Enviado
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#ef4444' }}>
                          <XCircle size={12} /> Erro
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{log.leads?.nome || '—'}</p>
                      <p className="text-xs" style={{ color: '#9B8EC4' }}>{log.leads?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{log.telefone}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: '#9B8EC4' }}>{fmt(log.created_at)}</td>
                    <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: '#9B8EC4' }}>
                      {log.resposta_api ? log.resposta_api.substring(0, 60) + (log.resposta_api.length > 60 ? '…' : '') : '—'}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr key={`${log.id}-expanded`} style={{ background: '#0D0B1E' }}>
                      <td colSpan={5} className="px-4 py-3 border-t" style={{ borderColor: '#2A1F5C' }}>
                        <div className="space-y-2">
                          {log.mensagem && (
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#9B8EC4' }}>Mensagem enviada:</p>
                              <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap" style={{ background: '#13102A', color: '#C4B5FD' }}>
                                {log.mensagem}
                              </pre>
                            </div>
                          )}
                          {log.resposta_api && (
                            <div>
                              <p className="text-xs font-semibold mb-1" style={{ color: '#9B8EC4' }}>Resposta completa da API:</p>
                              <pre className="text-xs p-3 rounded-lg whitespace-pre-wrap break-all" style={{ background: '#13102A', color: log.status === 'erro' ? '#fca5a5' : '#86efac' }}>
                                {log.resposta_api}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: '#2A1F5C' }}>
          <p className="text-xs" style={{ color: '#6B5FA0' }}>{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
    </div>
  )
}
