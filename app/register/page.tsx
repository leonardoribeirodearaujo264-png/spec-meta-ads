'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error: err } = await supabase.auth.signUp({ email, password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0F1E' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-white font-bold text-xl mb-2">Conta criada!</h2>
          <p className="text-slate-400 text-sm mb-6">
            Verifique seu e-mail para confirmar a conta, depois faça login.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-black"
            style={{ background: '#00D4FF' }}
          >
            Ir para o Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0A0F1E' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Advogado</h1>
          <h1 className="text-2xl font-bold" style={{ color: '#00D4FF' }}>Dominante</h1>
          <p className="text-slate-400 text-sm mt-2">Painel de Leads</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6 border" style={{ background: '#0d1526', borderColor: '#1e2a3a' }}>
          <h2 className="text-white font-semibold text-lg mb-5">Criar conta</h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: '#111827', border: '1px solid #1e2a3a' }}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg text-sm text-white outline-none"
                  style={{ background: '#111827', border: '1px solid #1e2a3a' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Confirmar senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repita a senha"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm text-white outline-none"
                style={{ background: '#111827', border: '1px solid #1e2a3a' }}
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-black disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#00D4FF' }}
            >
              {loading ? 'Criando...' : (
                <><UserPlus size={15} /> Criar conta</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-4">
          Já tem conta?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#00D4FF' }}>
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
