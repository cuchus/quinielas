import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role: sólo en servidor
  { auth: { persistSession: false } }
)

export async function POST() {
  try {
    // 1) Crea el usuario en Auth
    const { data, error } = await supaAdmin.auth.admin.createUser({
      email: 'admin@admin.com',
      password: 'prueba123',
      email_confirm: true,
    })
    if (error) throw error
    const authId = data.user!.id

    // 2) Inserta/actualiza en tu tabla users
    const { error: upErr } = await supaAdmin.from('users').upsert({
      auth_id: authId,
      name: 'admin',
      email: 'admin@admin.com',
      role: 'admin'
    }, { onConflict: 'auth_id' })
    if (upErr) throw upErr

    return NextResponse.json({ ok: true, auth_id: authId })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'seed failed' }, { status: 500 })
  }
}
