import { createSupabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
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
