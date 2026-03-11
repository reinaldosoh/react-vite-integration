import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    setLoading(false)
    if (error) setErro(error.message)
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6" style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">J</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">JurisRapido</h1>
          <p className="text-sm text-gray-400 mt-1">Acesse sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl border p-6 space-y-4">
          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-2.5">
              {erro}
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">E-mail</label>
            <input
              type="email" required autoComplete="email" placeholder="seu@email.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1.5 font-medium">Senha</label>
            <input
              type="password" required autoComplete="current-password" placeholder="Digite sua senha"
              value={senha} onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-black text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
