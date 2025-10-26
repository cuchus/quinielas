'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminPoolsPage() {
  const [name, setName] = useState('')
  const [pools, setPools] = useState<any[]>([])
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const t = data.session?.access_token
      if (!t) {
        window.location.href = '/login'
        return
      }
      setToken(t)
      await loadPools(t)
    })()
  }, [])

  async function loadPools(tok: string) {
    const res = await fetch('/api/admin/pools', {
      headers: { Authorization: `Bearer ${tok}` },
    })
    const j = await res.json()
    setPools(j.pools ?? [])
    setLoading(false)
  }

  async function crearPool(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    const res = await fetch('/api/admin/pools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    const j = await res.json()
    if (res.ok) {
      setName('')
      setPools([j.pool, ...pools])
    } else alert(j.error)
  }

  if (loading) return <main className="p-6 text-gray-500">Cargando...</main>

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">Administrar Ligas</h1>

      <form onSubmit={crearPool} className="flex gap-2">
        <input
          className="border rounded px-3 py-2 flex-1"
          placeholder="Nombre de la liga"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Crear
        </button>
      </form>

      <div className="border rounded-lg divide-y bg-white">
        {pools.map((p) => (
          <div key={p.id} className="p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">
                {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            <button
              className="text-blue-600 text-sm hover:underline"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${window.location.origin}/pools/join?id=${p.id}`
                )
              }
            >
              Copiar link de invitación 🔗
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
