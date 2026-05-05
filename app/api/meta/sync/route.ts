import { createSupabaseServerClient } from '@/lib/supabase-server'
import { syncMetaLeads } from '@/lib/sync'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const result = await syncMetaLeads()
  const status = result.ok ? 200 : result.error?.includes('não configurado') ? 400 : 500
  return NextResponse.json(result, { status })
}
