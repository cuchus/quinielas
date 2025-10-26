'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type UserRow = {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

export default function AdminUsuariosPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  })

  // edición
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editForm, setEditForm] = useState<UserRow | null>(null)

  // eliminación
  const [deleteUser, setDeleteUser] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // --- Cargar sesión y usuarios ---
  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const session = data.session
      if (!session) {
        router.replace('/login')
        return
      }

      const token = session.access_token
      setAccessToken(token)

      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 403) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      if (!res.ok) {
        setMsg('Error cargando usuarios')
        setLoading(false)
        return
      }

      const j = await res.json()
      if (!mounted) return
      setUsers(j.users ?? [])
      setIsAdmin(true)
      setLoading(false)
    })()
    return () => {
      mounted = false
    }
  }, [router])

  // --- Crear usuario ---
  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!accessToken) return

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(form),
    })

    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      setMsg(j?.error ?? 'Error al crear usuario')
      return
    }

    setMsg('Usuario creado ✅')
    setForm({ name: '', email: '', password: '', role: 'user' })
    refrescarUsuarios()
  }

  // --- Actualizar usuario ---
  async function actualizarUsuario(e: React.FormEvent) {
    e.preventDefault()
    if (!accessToken || !editForm) return

    const res = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(editForm),
    })

    const j = await res.json().catch(() => ({}))
    if (!res.ok) {
      alert(j?.error ?? 'Error al actualizar')
      return
    }

    alert('Usuario actualizado ✅')
    setEditUser(null)
    setEditForm(null)
    refrescarUsuarios()
  }

  // --- Eliminar usuario ---
  async function confirmarEliminacion() {
    if (!accessToken || !deleteUser) return
    try {
      setDeleting(true)
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ id: deleteUser.id }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(j?.error ?? 'No se pudo eliminar')
        return
      }
      setDeleteUser(null)
      await refrescarUsuarios()
      alert('Usuario eliminado ✅')
    } finally {
      setDeleting(false)
    }
  }

  async function refrescarUsuarios() {
    if (!accessToken) return
    const r2 = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const j2 = await r2.json()
    setUsers(j2.users ?? [])
  }

  if (loading)
    return (
      <main className="max-w-4xl mx-auto p-6 text-sm text-gray-500">
        Cargando...
      </main>
    )

  if (!isAdmin)
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-4 text-red-600">
          No tienes permisos para ver esta página.
        </p>
      </main>
    )

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <h1 className="text-3xl font-bold text-blue-700">
          👥 Administración de Usuarios
        </h1>
        <button
          className="ml-auto text-sm px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
          onClick={async () => {
            await supabase.auth.signOut()
            location.href = '/login'
          }}
        >
          Cerrar sesión
        </button>
      </header>

      {/* Formulario nuevo usuario */}
      <section className="bg-white border rounded-2xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">
          ➕ Nuevo usuario
        </h2>
        <form onSubmit={crearUsuario} className="grid gap-4 md:grid-cols-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Nombre completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as 'admin' | 'user' })
            }
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
          <input
            className="border rounded px-3 py-2"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2"
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <div className="md:col-span-2">
            <button className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2">
              Crear usuario
            </button>
            {msg && <span className="ml-3 text-sm text-green-700">{msg}</span>}
          </div>
        </form>
      </section>

      {/* Tabla usuarios */}
      <section className="bg-white border rounded-2xl p-6 shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          📋 Usuarios existentes
        </h2>
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 border-b">
              <th className="py-2 px-3 text-left">Nombre</th>
              <th className="py-2 px-3 text-left">Email</th>
              <th className="py-2 px-3 text-left">Rol</th>
              <th className="py-2 px-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-3">{u.name}</td>
                <td className="py-2 px-3">{u.email}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      u.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setEditUser(u)
                        setEditForm(u)
                      }}
                      title="Editar"
                    >
                      {/* ícono lápiz */}
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.414 2.586a2 2 0 0 0-2.828 0L6 11.172V14h2.828l8.586-8.586a2 2 0 0 0 0-2.828zM4 12V16h4l10-10-4-4L4 12z"/>
                      </svg>
                      <span>Editar</span>
                    </button>

                    <button
                      className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                      onClick={() => setDeleteUser(u)}
                      title="Eliminar"
                    >
                      {/* ícono basurero */}
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6 2a1 1 0 0 0-1 1v1H3a1 1 0 1 0 0 2h1v9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6h1a1 1 0 1 0 0-2h-2V3a1 1 0 0 0-1-1H6zm2 3h4V3H8v2z"/>
                      </svg>
                      <span>Eliminar</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!users.length && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-gray-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal de edición */}
      {editUser && editForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Editar usuario</h3>
            <form onSubmit={actualizarUsuario} className="space-y-3">
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Nombre"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
              <input
                className="border rounded px-3 py-2 w-full"
                placeholder="Email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
              <select
                className="border rounded px-3 py-2 w-full"
                value={editForm.role}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    role: e.target.value as 'admin' | 'user',
                  })
                }
              >
                <option value="user">Usuario</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    setEditUser(null)
                    setEditForm(null)
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {deleteUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-2 text-red-600">
              Eliminar usuario
            </h3>
            <p className="text-sm text-gray-600">
              ¿Seguro que deseas eliminar a <b>{deleteUser.name}</b> ({deleteUser.email})?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-5">
              <button
                className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
                onClick={() => setDeleteUser(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                onClick={confirmarEliminacion}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
