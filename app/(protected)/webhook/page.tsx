'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle, Globe, RefreshCw } from 'lucide-react'

export default function WebhookPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [verifyToken, setVerifyToken] = useState('carregando...')
  const [copied, setCopied] = useState<'url' | 'token' | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    setBaseUrl(window.location.origin)
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((j) => {
        setVerifyToken(j.settings?.WEBHOOK_VERIFY_TOKEN ?? process.env.NEXT_PUBLIC_WEBHOOK_VERIFY_TOKEN ?? 'não configurado')
      })
      .catch(() => setVerifyToken('erro ao carregar'))
  }, [])

  const webhookUrl = `${baseUrl}/api/webhook/meta`

  function copy(text: string, key: 'url' | 'token') {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function testWebhook() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/health')
      const json = await res.json()
      setTestResult({ ok: res.ok, msg: res.ok ? `API respondendo — ${json.timestamp}` : 'API não respondeu' })
    } catch (e) {
      setTestResult({ ok: false, msg: `Erro: ${String(e)}` })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">Webhook Meta</h1>
        <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Configure o webhook no painel de aplicativos da Meta</p>
      </div>

      {/* URL do Webhook */}
      <div className="rounded-xl border p-5 mb-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
        <div className="flex items-center gap-2 mb-3">
          <Globe size={16} style={{ color: '#8B5CF6' }} />
          <h2 className="text-sm font-semibold text-white">URL do Webhook</h2>
        </div>
        <p className="text-xs mb-3" style={{ color: '#9B8EC4' }}>
          Cole esta URL no campo <strong style={{ color: '#fff' }}>Callback URL</strong> no Meta for Developers.
        </p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 px-3 py-2.5 rounded-lg text-sm break-all"
            style={{ background: '#100D26', border: '1px solid #2A1F5C', color: '#C4B5FD' }}
          >
            {webhookUrl || 'https://seu-dominio.vercel.app/api/webhook/meta'}
          </code>
          <button
            onClick={() => copy(webhookUrl, 'url')}
            className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-1.5 flex-shrink-0"
            style={{ background: '#2A1F5C', color: copied === 'url' ? '#22c55e' : '#8B5CF6' }}
          >
            {copied === 'url' ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied === 'url' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Verify Token */}
      <div className="rounded-xl border p-5 mb-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
        <h2 className="text-sm font-semibold text-white mb-3">Verify Token</h2>
        <p className="text-xs mb-3" style={{ color: '#9B8EC4' }}>
          Cole este token no campo <strong style={{ color: '#fff' }}>Verify Token</strong> no Meta for Developers.
          Para alterar, vá em <strong style={{ color: '#8B5CF6' }}>Configurações</strong>.
        </p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 px-3 py-2.5 rounded-lg text-sm"
            style={{ background: '#100D26', border: '1px solid #2A1F5C', color: '#C4B5FD' }}
          >
            {verifyToken}
          </code>
          <button
            onClick={() => copy(verifyToken, 'token')}
            className="px-3 py-2.5 rounded-lg text-sm flex items-center gap-1.5 flex-shrink-0"
            style={{ background: '#2A1F5C', color: copied === 'token' ? '#22c55e' : '#8B5CF6' }}
          >
            {copied === 'token' ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied === 'token' ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      {/* Passo a passo */}
      <div className="rounded-xl border p-5 mb-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
        <h2 className="text-sm font-semibold text-white mb-3">Como configurar na Meta</h2>
        <ol className="space-y-2 text-sm" style={{ color: '#9B8EC4' }}>
          {[
            'Acesse developers.facebook.com → Meus Aplicativos → selecione seu app',
            'Vá em Produtos → Leads Ads → Webhooks',
            'Clique em "Editar assinatura" ou "Adicionar URL de retorno de chamada"',
            'Cole a URL do webhook no campo "Callback URL"',
            'Cole o Verify Token no campo "Verify Token"',
            'Clique em "Verificar e salvar" — o botão de teste abaixo confirma que a API responde',
            'Assine o campo "leadgen" para receber leads em tempo real',
          ].map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#2A1F5C', color: '#8B5CF6' }}>{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Test */}
      <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
        <h2 className="text-sm font-semibold text-white mb-3">Testar API</h2>
        <p className="text-xs mb-3" style={{ color: '#9B8EC4' }}>
          Verifica se a API está respondendo corretamente.
        </p>
        <button
          onClick={testWebhook}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
          style={{ background: '#2A1F5C', color: '#8B5CF6' }}
        >
          <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
          {testing ? 'Testando...' : 'Testar agora'}
        </button>
        {testResult && (
          <div
            className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              background: testResult.ok ? '#14532d' : '#450a0a',
              color: testResult.ok ? '#86efac' : '#fca5a5',
              border: `1px solid ${testResult.ok ? '#166534' : '#7f1d1d'}`,
            }}
          >
            {testResult.ok ? <CheckCircle size={14} /> : <span>✗</span>}
            {testResult.msg}
          </div>
        )}
      </div>
    </div>
  )
}
