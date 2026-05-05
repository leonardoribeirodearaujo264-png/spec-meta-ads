import { createSupabaseAdmin } from '@/lib/supabase'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Verificar autenticação
    const supabaseAuth = await createSupabaseServerClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar leads com service role (sem RLS)
    const supabase = createSupabaseAdmin()
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ leads: data ?? [] })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ leads: [], error: 'Erro ao buscar leads' }, { status: 500 })
  }
}
