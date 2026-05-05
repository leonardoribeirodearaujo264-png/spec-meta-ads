'use client'

import { useEffect, useState } from 'react'
import { Settings, RefreshCw, CheckCircle } from 'lucide-react'

interface SettingsMap {
  META_APP_ID?: string
  META_PAGE_ID?: string
  META_FORM_ID?: string
  WEBHOOK_VERIFY_TOKEN?: string
  UAZAPI_URL?: string
  UAZAPI_TOKEN?: string
  UAZAPI_INSTANCE?: string
  WHATSAPP_GROUP_LINK?: string
  DEFAULT_MESSAGE?: string
}

const SECTIONS = [
  {
    title: 'Meta / Facebook Ads',
    fields: [
      { key: 'META_APP_ID', label: 'App ID da Meta', placeholder: 'Ex: 12946811156173252' },
      { key: 'META_PAGE_ID', label: 'Page ID', placeholder: 'Ex: 11115520994969220' },
      { key: 'META_FORM_ID', label: 'Form ID (Lead Ad)', placeholder: 'Ex: 120244050119500193' },
      { key: 'WEBHOOK_VERIFY_TOKEN', label: 'Webhook Verify Token', placeholder: 'Token secreto para verificação' },
    ],
  },
  {
    title: 'WhatsApp / UazapiGO',
    fields: [
      { key: 'UAZAPI_URL', label: 'URL Base da UazapiGO', placeholder: 'https://uazapi.dev' },
      { key: 'UAZAPI_TOKEN', label: 'Token Admin', placeholder: 'Token de autenticação' },
      { key: 'UAZAPI_INSTANCE', label: 'Nome da Instância', placeholder: 'nome-da-instancia' },
      { key: 'WHATSAPP_GROUP_LINK', label: 'Link do Grupo WhatsApp', placeholder: 'https://chat.whatsapp.com/...' },
    ],
  },
]

export default function ConfiguracoesPage() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin" style={{ color: '#8B5CF6' }} />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Configurações</h1>
          <p className="text-sm mt-0.5" style={{ color: '#9B8EC4' }}>Gerencie integrações e dados do sistema</p>
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
            <><Settings size={14} /> Salvar</>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border p-5" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
            <h2 className="text-sm font-semibold text-white mb-4">{section.title}</h2>
            <div className="space-y-4">
              {section.fields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>{label}</label>
                  <input
                    type="text"
                    value={(settings as Record<string, string>)[key] ?? ''}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
                    style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Mensagem padrão */}
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
            <strong style={{ color: '#9B8EC4' }}>Nota:</strong> As chaves do Supabase (URL e tokens) são gerenciadas via variáveis de ambiente na Vercel por razões de segurança e não aparecem aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
