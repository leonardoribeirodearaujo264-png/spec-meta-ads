import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseAuth = await createSupabaseServerClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('message_logs')
    .select('*, leads(nome, email)')
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) return NextResponse.json({ logs: [], error: error.message }, { status: 500 })
  return NextResponse.json({ logs: data ?? [] })
}
