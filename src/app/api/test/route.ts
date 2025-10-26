import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

// Client de servidor con service role (solo del lado server)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(_req: NextRequest) {
  const { data, error } = await supabase.from('seasons').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
