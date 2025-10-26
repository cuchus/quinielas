'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // si ya hay sesión, ve directo a /picks
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/picks')
    })
  }, [router])

  async function doLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email || !password) { setError('Ingresa email y contraseña'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message); return }
    router.replace('/picks')
  }

  return (
    <main className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>
      <form onSubmit={doLogin} className="grid gap-3">
        <input
          className="border rounded px-3 py-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />
        <div className="flex border rounded overflow-hidden">
          <input
            className="px-3 py-2 flex-1 outline-none"
            type={show ? 'text' : 'password'}
            placeholder="Contraseña"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />
          <button type="button" className="px-3 text-sm text-gray-600" onClick={()=>setShow(s=>!s)}>
            {show ? 'Ocultar' : 'Ver'}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={loading} className="bg-blue-600 text-white rounded px-3 py-2 disabled:opacity-50">
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 text-xs text-gray-500">
        ¿Aún no existe el admin? Corre el seed y usa: admin@admin.com / prueba123
      </div>
    </main>
  )
}

