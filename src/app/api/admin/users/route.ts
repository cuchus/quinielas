import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 🔹 Cliente público (solo para validar sesión desde token del usuario)
const supaAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } }
)

// 🔹 Cliente con Service Role (para saltar RLS y hacer admin ops)
const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * 🧩 Verifica que el token pertenece a un usuario con rol "admin"
 */
async function assertIsAdmin(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) throw new Error('No auth token')

  // Validar token contra Auth
  const { data: userData, error: uErr } = await supaAnon.auth.getUser(token)
  if (uErr || !userData.user) throw new Error('Invalid session')

  const email = userData.user.email
  if (!email) throw new Error('No email in token')

  // Buscar al usuario en la tabla users
  const { data: prof, error: pErr } = await supaAdmin
    .from('users')
    .select('id, role, name, email')
    .ilike('email', email)
    .maybeSingle()

  if (pErr) throw new Error('DB error: ' + pErr.message)
  if (!prof) throw new Error(`Usuario ${email} no encontrado`)
  if (prof.role !== 'admin') throw new Error('Forbidden')

  return { uid: prof.id, prof }
}

/**
 * 🔹 GET: Lista de usuarios
 */
export async function GET(req: Request) {
  try {
    await assertIsAdmin(req)

    const { data, error } = await supaAdmin
      .from('users')
      .select('id, name, email, role')
      .order('name', { ascending: true })

    if (error) throw error
    return NextResponse.json({ users: data ?? [] })
  } catch (e: any) {
    console.error('[API USERS GET]', e?.message ?? e)
    const msg = e?.message ?? 'Unauthorized'
    const code =
      msg === 'Forbidden'
        ? 403
        : msg.includes('auth') || msg.includes('session')
        ? 401
        : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

/**
 * 🔹 POST: Crea nuevo usuario en Auth y tabla users
 */
export async function POST(req: Request) {
  try {
    await assertIsAdmin(req)

    const { email, password, name, role = 'user' } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
    }
    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Role inválido' }, { status: 400 })
    }

    // Crea usuario en Auth
    const { data: created, error: cErr } = await supaAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (cErr) return NextResponse.json({ error: cErr.message }, { status: 400 })
    const newId = created.user!.id

    // Upsert a tabla users
    const { error: upErr } = await supaAdmin.from('users').upsert({
      id: newId,
      name,
      email,
      role,
    })
    if (upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, id: newId })
  } catch (e: any) {
    console.error('[API USERS POST]', e?.message ?? e)
    const msg = e?.message ?? 'Unauthorized'
    const code =
      msg === 'Forbidden'
        ? 403
        : msg.includes('auth') || msg.includes('session')
        ? 401
        : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

/**
 * 🔹 PUT: Actualiza usuario (name, email, role)
 */
export async function PUT(req: Request) {
  try {
    await assertIsAdmin(req)
    const { id, name, email, role } = await req.json()

    if (!id || !name || !email || !['admin', 'user'].includes(role))
      return NextResponse.json({ error: 'Campos inválidos' }, { status: 400 })

    const { error } = await supaAdmin
      .from('users')
      .update({ name, email, role })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API USERS PUT]', e?.message ?? e)
    const msg = e?.message ?? 'Unauthorized'
    const code =
      msg === 'Forbidden'
        ? 403
        : msg.includes('auth') || msg.includes('session')
        ? 401
        : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}

/**
 * 🔹 DELETE: Elimina usuario (BD -> Auth)
 * Body esperado: { id: string }
 */
export async function DELETE(req: Request) {
  try {
    await assertIsAdmin(req)
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

    // 1) Borra en BD (puede fallar si hay FK; maneja esto según tus ON DELETE)
    const { error: dbErr } = await supaAdmin.from('users').delete().eq('id', id)
    if (dbErr) {
      return NextResponse.json({ error: dbErr.message }, { status: 400 })
    }

    // 2) Borra en Auth (si el usuario no existe en Auth, ignoramos el error)
    const { error: authErr } = await supaAdmin.auth.admin.deleteUser(id)
    if (authErr) {
      // No revertimos la BD: informamos pero devolvemos ok (o cambia a 400 si prefieres tomarlo como error)
      console.warn('[AUTH DELETE WARN]', authErr.message)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[API USERS DELETE]', e?.message ?? e)
    const msg = e?.message ?? 'Unauthorized'
    const code =
      msg === 'Forbidden'
        ? 403
        : msg.includes('auth') || msg.includes('session')
        ? 401
        : 500
    return NextResponse.json({ error: msg }, { status: code })
  }
}
