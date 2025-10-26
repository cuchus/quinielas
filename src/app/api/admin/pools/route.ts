import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supaAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
const supaAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function assertAdmin(req: Request) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) throw new Error('Unauthorized')

  const { data } = await supaAnon.auth.getUser(token)
  if (!data.user) throw new Error('Unauthorized')

  const { data: user } = await supaAdmin
    .from('users')
    .select('role')
    .eq('auth_id', data.user.id)
    .single()

  if (!user || user.role !== 'admin') throw new Error('Forbidden')
  return data.user
}

// GET – lista de pools
export async function GET(req: Request) {
  try {
    await assertAdmin(req)
    const { data, error } = await supaAdmin.from('pools').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ pools: data })
  } catch (e: any) {
    const status = e.message === 'Forbidden' ? 403 : 401
    return NextResponse.json({ error: e.message }, { status })
  }
}

// POST – crear pool
export async function POST(req: Request) {
  try {
    await assertAdmin(req)
    const { name, season_id } = await req.json()
    if (!name) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })

    const { data, error } = await supaAdmin.from('pools').insert({ name, season_id }).select('*').single()
    if (error) throw error
    return NextResponse.json({ ok: true, pool: data })
  } catch (e: any) {
    const status = e.message === 'Forbidden' ? 403 : 401
    return NextResponse.json({ error: e.message }, { status })
  }
}
