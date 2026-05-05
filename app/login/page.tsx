'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })

    if (err) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0D0B1E' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Advogado</h1>
          <h1 className="text-2xl font-bold" style={{ color: '#8B5CF6' }}>Dominante</h1>
          <p className="text-sm mt-2" style={{ color: '#9B8EC4' }}>Painel de Leads</p>
        </div>

        <div className="rounded-2xl p-6 border" style={{ background: '#13102A', borderColor: '#2A1F5C' }}>
          <h2 className="text-white font-semibold text-lg mb-5">Entrar na conta</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#9B8EC4' }}>Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white outline-none"
                  style={{ background: '#100D26', border: '1px solid #2A1F5C' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#9B8EC4' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#8B5CF6' }}
            >
              {loading ? 'Entrando...' : <><LogIn size={15} /> Entrar</>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-4" style={{ color: '#6B5FA0' }}>
          Não tem conta?{' '}
          <Link href="/register" className="font-medium hover:underline" style={{ color: '#8B5CF6' }}>
            Registrar
          </Link>
        </p>
      </div>
    </div>
  )
}
