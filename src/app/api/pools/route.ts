import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user')
  if (!userId) return NextResponse.json({ error: 'Falta user' }, { status: 400 })

  const { data, error } = await supabase
    .from('user_pools')
    .select('pool_id, pools(name, id, created_at)')
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pools: data })
}

export async function POST(req: Request) {
  const { user_id, pool_id } = await req.json()
  if (!user_id || !pool_id)
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })

  const { error } = await supabase.from('user_pools').insert({ user_id, pool_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
