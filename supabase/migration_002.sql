-- ============================================================
-- MIGRATION 002 — Adicionar colunas de integração Meta
-- Execute no SQL Editor do Supabase (apenas uma vez)
-- ============================================================

-- Adicionar facebook_lead_id para deduplicação de leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_lead_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS form_id text;

-- Índice único parcial: permite múltiplos NULL mas impede facebook_lead_id duplicado
CREATE UNIQUE INDEX IF NOT EXISTS leads_facebook_lead_id_idx
  ON leads (facebook_lead_id)
  WHERE facebook_lead_id IS NOT NULL;

-- Índice para buscas por form_id
CREATE INDEX IF NOT EXISTS leads_form_id_idx ON leads (form_id);
