'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, LogOut, Users } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const NAV = [
  { href: '/dashboard', label: 'Leads', icon: LayoutDashboard },
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
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 h-full w-60 flex-col z-20"
        style={{ background: '#0d1526', borderRight: '1px solid #1e2a3a' }}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b" style={{ borderColor: '#1e2a3a' }}>
          <p className="text-white font-bold text-base leading-tight">Advogado</p>
          <p className="font-bold text-base leading-tight" style={{ color: '#00D4FF' }}>Dominante</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: active ? '#1e2a3a' : 'transparent',
                  color: active ? '#00D4FF' : '#94a3b8',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + logout */}
        <div className="p-4 border-t" style={{ borderColor: '#1e2a3a' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1e2a3a', color: '#00D4FF' }}>
              <Users size={14} />
            </div>
            <p className="text-slate-400 text-xs truncate flex-1">{userEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-400 transition-colors w-full"
          >
            <LogOut size={13} />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 z-20"
        style={{ background: '#0d1526', borderBottom: '1px solid #1e2a3a' }}
      >
        <div>
          <span className="text-white font-bold text-sm">Advogado </span>
          <span className="font-bold text-sm" style={{ color: '#00D4FF' }}>Dominante</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </header>
    </>
  )
}
