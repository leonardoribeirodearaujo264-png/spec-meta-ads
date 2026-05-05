'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Send,
  Webhook,
  Settings,
  FileText,
  LogOut,
} from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/disparar', label: 'Disparar Mensagem', icon: Send },
  { href: '/webhook', label: 'Webhook Meta', icon: Webhook },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/logs', label: 'Logs', icon: FileText },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-20"
        style={{ background: '#13102A', borderRight: '1px solid #2A1F5C' }}
      >
        <div className="px-6 py-5 border-b" style={{ borderColor: '#2A1F5C' }}>
          <p className="text-white font-bold text-base leading-tight">Advogado</p>
          <p className="font-bold text-base leading-tight" style={{ color: '#8B5CF6' }}>Dominante</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? '#2A1F5C' : 'transparent',
                  color: active ? '#8B5CF6' : '#9B8EC4',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t" style={{ borderColor: '#2A1F5C' }}>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: '#2A1F5C', color: '#8B5CF6' }}
            >
              <Users size={14} />
            </div>
            <p className="text-xs truncate flex-1" style={{ color: '#9B8EC4' }}>{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs transition-colors w-full hover:text-red-400"
            style={{ color: '#9B8EC4' }}
          >
            <LogOut size={13} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20"
        style={{ background: '#13102A', borderBottom: '1px solid #2A1F5C' }}
      >
        <div>
          <span className="text-white font-bold text-sm">Advogado </span>
          <span className="font-bold text-sm" style={{ color: '#8B5CF6' }}>Dominante</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs hover:text-red-400 transition-colors"
          style={{ color: '#9B8EC4' }}
        >
          <LogOut size={14} />
          Sair
        </button>
      </header>
    </>
  )
}
