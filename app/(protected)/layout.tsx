import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import Sidebar from '@/app/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: '#0A0F1E' }}>
      <Sidebar userEmail={user.email ?? ''} />
      {/* offset para a sidebar no desktop e top bar no mobile */}
      <div className="md:ml-60 pt-14 md:pt-0">
        {children}
      </div>
    </div>
  )
}
