-- ============================================================
-- ADVOGADO DOMINANTE — Schema Supabase
-- Execute este arquivo no SQL Editor do Supabase
-- ============================================================

-- Tabela de leads capturados via Meta Ads
CREATE TABLE IF NOT EXISTS leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome             text,
  telefone         text,
  email            text,
  whatsapp_enviado boolean DEFAULT false,
  whatsapp_enviado_em timestamptz,
  erro_whatsapp    text,
  created_at       timestamptz DEFAULT now()
);

-- Tabela de logs de mensagens enviadas
CREATE TABLE IF NOT EXISTS message_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      uuid REFERENCES leads(id) ON DELETE SET NULL,
  telefone     text NOT NULL,
  mensagem     text,
  status       text NOT NULL CHECK (status IN ('enviado', 'erro')),
  resposta_api text,
  created_at   timestamptz DEFAULT now()
);

-- Tabela de configurações do sistema (chave-valor)
CREATE TABLE IF NOT EXISTS app_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text UNIQUE NOT NULL,
  value      text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_whatsapp_enviado_idx ON leads (whatsapp_enviado);
CREATE INDEX IF NOT EXISTS message_logs_lead_id_idx ON message_logs (lead_id);
CREATE INDEX IF NOT EXISTS message_logs_created_at_idx ON message_logs (created_at DESC);

-- Habilitar RLS (o service_role ignora RLS, então apenas protege acesso direto)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
