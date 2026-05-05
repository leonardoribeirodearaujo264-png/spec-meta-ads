'use client'

import { useEffect, useState } from 'react'
import { Settings, RefreshCw, CheckCircle, Eye, EyeOff, Copy, Globe } from 'lucide-react'

interface SettingsMap extends Record<string, string | undefined> {
  META_ACCESS_TOKEN?: string
  META_PAGE_ID?: string
  META_FORM_ID?: string
  WEBHOOK_VERIFY_TOKEN?: string
  UAZAPI_URL?: string
  UAZAPI_TOKEN?: string
  UAZAPI_INSTANCE?: string
  WHATSAPP_GROUP_LINK?: string
  DEFAULT_MESSAGE?: string
}

interface MetaForm {
  id: string
  name: string
  status: string
  leads_count?: number
}

interface MetaPage {
  id: string
  name: string
  access_token: string
  category?: string
}

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copiedWebhook, setCopiedWebhook] = useState(false)

  // Meta test
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; info: string } | null>(null)

  // Pages discovery
  const [loadingPages, setLoadingPages] = useState(false)
  const [pages, setPages] = useState<MetaPage[]>([])
  const [pagesError, setPagesError] = useState('')

  // Forms
  const [loadingForms, setLoadingForms] = useState(false)
  const [forms, setForms] = useState<MetaForm[]>([])
  const [formsError, setFormsError] = useState('')

  // Sync
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ ok: boolean; msg: string } | null>(null)

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhook/meta`)
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((j) => setSettings(j.settings ?? {}))
      .finally(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setSaved(false)
    try {
      await fetch('/api/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  async function testarConexao() {
    await saveAndFlush()
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/meta/test')
      const json = await res.json()
      setTestResult(json)
    } finally {
      setTesting(false)
    }
  }

  async function saveAndFlush() {
    await fetch('/api/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
  }

  async function buscarPaginas() {
    await saveAndFlush()
    setLoadingPages(true)
    setPages([])
    setPagesError('')
    setForms([])
    setFormsError('')
    try {
      const res = await fetch('/api/meta/pages')
      const json = await res.json()
      if (json.ok) {
        setPages(json.pages ?? [])
        if ((json.pages ?? []).length === 0) setPagesError('Nenhuma página encontrada nesta conta.')
      } else {
        setPagesError(json.error ?? 'Erro ao buscar páginas.')
      }
    } finally {
      setLoadingPages(false)
    }
  }

  async function selecionarPagina(page: MetaPage) {
    // Auto-fill Page ID + page access token
    setSettings((prev) => ({
      ...prev,
      META_PAGE_ID: page.id,
      META_ACCESS_TOKEN: page.access_token,
    }))
    // Save immediately so form fetch uses the page token
    await fetch('/api/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...settings,
          META_PAGE_ID: page.id,
          META_ACCESS_TOKEN: page.access_token,
        },
      }),
    })
    // Auto-fetch forms for this page
    setLoadingForms(true)
    setForms([])
    setFormsError('')
    try {
      const res = await fetch('/api/meta/forms')
      const json = await res.json()
      if (json.ok) {
        setForms(json.forms ?? [])
        if ((json.forms ?? []).length === 0) setFormsError('Nenhum formulário encontrado nesta página.')
      } else {
        setFormsError(json.error ?? 'Erro ao buscar formulários.')
      }
    } finally {
      setLoadingForms(false)
    }
  }

  async function buscarFormularios() {
    await saveAndFlush()
    setLoadingForms(true)
    setForms([])
    setFormsError('')
    try {
      const res = await fetch('/api/meta/forms')
      const json = await res.json()
      if (json.ok) {
        setForms(json.forms ?? [])
        if ((json.forms ?? []).length === 0) setFormsError('Nenhum formulário encontrado nesta página.')
      } else {
        setFormsError(json.error ?? 'Erro ao buscar formulários.')
      }
    } finally {
      setLoadingForms(false)
    }
  }

  async function sincronizarLeads() {
    await saveAndFlush()
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/meta/sync', { method: 'POST' })
      const json = await res.json()
      if (json.ok) {
        setSyncResult({
          ok: true,
          msg: `✓ ${json.importados} importados | ${json.ignorados} já existentes | Total Meta: ${json.total}`,
        })
      } else {
        setSyncResult({ ok: false, msg: json.error ?? 'Erro na sincronização' })
      }
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-64">
        <RefreshCw size={20} className="animate-spin" style={{ color: '#8B5CF6' }} />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Integrações, tokens e mensagens</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
          style={{ background: '#8B5CF6', color: '#fff' }}
        >
          {saving ? (
            <><RefreshCw size={14} className="animate-spin" /> Salvando...</>
          ) : saved ? (
            <><CheckCircle size={14} /> Salvo!</>
          ) : (
            <><Settings size={14} /> Salvar tudo</>
          )}
        </button>
      </div>

      <div className="space-y-5">

        {/* ── URL DO WEBHOOK ── */}
        <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-sm font-semibold text-white mb-1">URL do Webhook — Meta Lead Ads</h2>
          <p className="text-xs mb-3" style={{ color: '#9B8EC4' }}>
            Cole essa URL no <strong style={{ color: '#fff' }}>Meta Business Manager → Webhooks → Campo: leadgen</strong>.
            Use o <strong style={{ color: '#fff' }}>Verify Token</strong> configurado na seção de Webhook abaixo.
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 px-3 py-2.5 rounded-lg text-xs break-all select-all"
              style={{ background: '#100D26', color: '#C4B5FD', border: '1px solid #2A1F5C' }}
            >
              {webhookUrl || 'Carregando...'}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(webhookUrl)
                setCopiedWebhook(true)
                setTimeout(() => setCopiedWebhook(false), 2000)
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors"
              style={{ background: copiedWebhook ? '#14532d' : '#2A1F5C', color: copiedWebhook ? '#86efac' : '#8B5CF6' }}
            >
              <Copy size={12} />
              {copiedWebhook ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#6B5FA0' }}>
            A sincronização automática roda a cada 15 minutos via cron. O webhook garante tempo real.
          </p>
        </div>

        {/* ── META / FACEBOOK ADS ── */}
        <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-sm font-semibold text-white mb-1">Meta / Facebook Ads</h2>
          <p className="text-xs mb-4" style={{ color: '#9B8EC4' }}>
            Use um <strong style={{ color: '#fff' }}>Page Access Token</strong> com permissão{' '}
            <code style={{ color: '#8B5CF6' }}>leads_retrieval</code>. Tokens de curta duração expiram em 1h —
            prefira um token de sistema permanente.
          </p>

          {/* Access Token */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>
              Access Token (Page Token) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={settings.META_ACCESS_TOKEN ?? ''}
                onChange={(e) => set('META_ACCESS_TOKEN', e.target.value)}
                placeholder="EAABs...token longo aqui"
                className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white outline-none"
                style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9B8EC4' }}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Page ID */}
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>
              Page ID (ID da Página)
            </label>
            <input
              type="text"
              value={settings.META_PAGE_ID ?? ''}
              onChange={(e) => set('META_PAGE_ID', e.target.value)}
              placeholder="Ex: 11115520994969220"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
            />
          </div>

          {/* Form ID */}
          <div className="mb-5">
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>
              Form ID (ID do Formulário de Lead Ad) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={settings.META_FORM_ID ?? ''}
              onChange={(e) => set('META_FORM_ID', e.target.value)}
              placeholder="Ex: 120244050119500193"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
            />
            <p className="text-xs mt-1" style={{ color: '#6B5FA0' }}>
              Use o botão "Buscar formulários" para ver todos os IDs disponíveis na sua página.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={testarConexao}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-60"
              style={{ background: '#2A1F5C', color: '#8B5CF6' }}
            >
              <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
              {testing ? 'Testando...' : 'Testar token'}
            </button>

            <button
              onClick={buscarPaginas}
              disabled={loadingPages}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
              style={{ background: '#4C1D95', color: '#C4B5FD', border: '1px solid #5B21B6' }}
            >
              <Globe size={12} className={loadingPages ? 'animate-spin' : ''} />
              {loadingPages ? 'Buscando...' : 'Buscar páginas da conta'}
            </button>

            <button
              onClick={buscarFormularios}
              disabled={loadingForms}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-60"
              style={{ background: '#2A1F5C', color: '#8B5CF6' }}
            >
              <RefreshCw size={12} className={loadingForms ? 'animate-spin' : ''} />
              {loadingForms ? 'Buscando...' : 'Buscar formulários'}
            </button>

            <button
              onClick={sincronizarLeads}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-60"
              style={{ background: '#8B5CF6', color: '#fff' }}
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Sincronizar leads agora'}
            </button>
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{
                background: testResult.ok ? '#14532d' : '#450a0a',
                color: testResult.ok ? '#86efac' : '#fca5a5',
                border: `1px solid ${testResult.ok ? '#166534' : '#7f1d1d'}`,
              }}
            >
              {testResult.ok ? <CheckCircle size={12} /> : '✗'} {testResult.info}
            </div>
          )}

          {/* Sync result */}
          {syncResult && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-xs"
              style={{
                background: syncResult.ok ? '#14532d' : '#450a0a',
                color: syncResult.ok ? '#86efac' : '#fca5a5',
                border: `1px solid ${syncResult.ok ? '#166534' : '#7f1d1d'}`,
              }}
            >
              {syncResult.msg}
            </div>
          )}

          {/* Pages list */}
          {pagesError && (
            <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              {pagesError}
            </div>
          )}
          {pages.length > 0 && (
            <div className="rounded-lg overflow-hidden border mb-3" style={{ borderColor: '#5B21B6' }}>
              <p className="px-3 py-2 text-xs font-semibold" style={{ background: '#1E1041', color: '#C4B5FD' }}>
                Páginas encontradas — clique para selecionar e buscar formulários
              </p>
              {pages.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selecionarPagina(p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 border-t text-left hover:bg-white/5 transition-colors"
                  style={{ borderColor: '#5B21B6' }}
                >
                  <div>
                    <p className="text-sm text-white font-medium">{p.name}</p>
                    <p className="text-xs" style={{ color: '#9B8EC4' }}>
                      ID: {p.id} {p.category ? `· ${p.category}` : ''}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: '#2A1F5C', color: '#8B5CF6' }}>
                    Selecionar →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Forms list */}
          {formsError && (
            <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: '#450a0a', color: '#fca5a5', border: '1px solid #7f1d1d' }}>
              {formsError}
            </div>
          )}
          {forms.length > 0 && (
            <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#2A1F5C' }}>
              <p className="px-3 py-2 text-xs font-semibold" style={{ background: '#100D26', color: '#9B8EC4' }}>
                Formulários encontrados — clique no ID para copiar
              </p>
              {forms.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: '#2A1F5C' }}>
                  <div>
                    <p className="text-sm text-white font-medium">{f.name}</p>
                    <p className="text-xs" style={{ color: '#9B8EC4' }}>
                      Status: {f.status} {f.leads_count !== undefined ? `· ${f.leads_count} leads` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(f.id)
                      set('META_FORM_ID', f.id)
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium"
                    style={{ background: '#2A1F5C', color: '#8B5CF6' }}
                    title="Copiar e selecionar este Form ID"
                  >
                    <Copy size={11} />
                    {f.id}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── WEBHOOK ── */}
        <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-sm font-semibold text-white mb-4">Webhook</h2>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>Verify Token</label>
            <input
              type="text"
              value={settings.WEBHOOK_VERIFY_TOKEN ?? ''}
              onChange={(e) => set('WEBHOOK_VERIFY_TOKEN', e.target.value)}
              placeholder="Token secreto para verificação do webhook"
              className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
            />
          </div>
        </div>

        {/* ── WHATSAPP / UAZAPIGO ── */}
        <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-sm font-semibold text-white mb-4">WhatsApp / UazapiGO</h2>
          <div className="space-y-4">
            {[
              { key: 'UAZAPI_URL', label: 'URL Base da API', placeholder: 'https://uazapi.dev' },
              { key: 'UAZAPI_TOKEN', label: 'Token Admin', placeholder: 'Token de autenticação' },
              { key: 'UAZAPI_INSTANCE', label: 'Nome da Instância', placeholder: 'nome-da-instancia' },
              { key: 'WHATSAPP_GROUP_LINK', label: 'Link do Grupo WhatsApp ({link})', placeholder: 'https://chat.whatsapp.com/...' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>{label}</label>
                <input
                  type="text"
                  value={settings[key] ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── MENSAGEM PADRÃO ── */}
        <div className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-sm font-semibold text-white mb-1">Mensagem padrão do WhatsApp</h2>
          <p className="text-xs mb-3" style={{ color: '#9B8EC4' }}>
            Use <code style={{ color: '#8B5CF6' }}>{'{nome}'}</code> e <code style={{ color: '#8B5CF6' }}>{'{link}'}</code> como variáveis dinâmicas.
          </p>
          <textarea
            rows={8}
            value={settings.DEFAULT_MESSAGE ?? ''}
            onChange={(e) => set('DEFAULT_MESSAGE', e.target.value)}
            placeholder="Olá {nome}! Seu link de acesso: {link}"
            className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none resize-none"
            style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
          />
        </div>

        <div className="rounded-xl border p-4" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <p className="text-xs" style={{ color: '#6B5FA0' }}>
            <strong style={{ color: '#9B8EC4' }}>Segurança:</strong> As chaves do Supabase ficam somente nas variáveis de ambiente da Vercel — não são exibidas aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
