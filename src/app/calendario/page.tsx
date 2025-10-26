// src/app/calendario/page.tsx
import { createClient } from "@supabase/supabase-js"

/** --- Supabase (SSR) --- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/** --- Colores por equipo (primario aprox. oficial) --- */
const TEAM_COLOR: Record<string, string> = {
  ARI: "#97233F",
  ATL: "#A71930",
  BAL: "#241773",
  BUF: "#00338D",
  CAR: "#0085CA",
  CHI: "#0B162A",
  CIN: "#FB4F14",
  CLE: "#311D00",
  DAL: "#003594",
  DEN: "#002244",
  DET: "#0076B6",
  GB:  "#203731",
  HOU: "#03202F",
  IND: "#002C5F",
  JAX: "#006778",
  KC:  "#E31837",
  LV:  "#000000",
  LAC: "#0080C6",
  LAR: "#003594",
  MIA: "#008E97",
  MIN: "#4F2683",
  NE:  "#002244",
  NO:  "#D3BC8D",
  NYG: "#0B2265",
  NYJ: "#125740",
  PHI: "#004C54",
  PIT: "#FFB612",
  SF:  "#AA0000",
  SEA: "#002244",
  TB:  "#D50A0A",
  TEN: "#4B92DB",
  WAS: "#5A1414",
}

/** --- Utilidades --- */
function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}
function isLight(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  // luminancia relativa aproximada
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return L > 0.6
}
function fmtMX(dateIso: string) {
  const d = new Date(dateIso)
  const fDate = d.toLocaleDateString("es-MX", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    day: "2-digit",
    month: "short",
  })
  const fTime = d.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  return `${fDate} • ${fTime}`
}

/** --- UI --- */
function TeamChip({ short }: { short: string }) {
  const bg = TEAM_COLOR[short] ?? "#6B7280" // gray-500 fallback
  const light = isLight(bg)
  return (
    <span
      className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color: light ? "#000" : "#fff" }}
      title={short}
    >
      {/* círculo de color */}
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full ring-2"
        style={{ backgroundColor: light ? "#000" : "#fff", opacity: 0.85 }}
      />
      {short}
    </span>
  )
}

type GameRow = {
  id: string
  kickoff_at: string
  home: { short_name: string }
  away: { short_name: string }
  week: { week_number: number }
}

export default async function CalendarioPage() {
  const { data, error } = await supabase
    .from("games")
    .select(`
      id,
      kickoff_at,
      home:home_team_id(short_name),
      away:away_team_id(short_name),
      week:week_id(week_number)
    `)
    .order("kickoff_at", { ascending: true })

  if (error) {
    console.error(error)
    return (
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold">Calendario NFL 2025</h1>
        <p className="mt-4 text-red-600">Error al cargar: {error.message}</p>
      </main>
    )
  }

  // Agrupa por semana. Cast the incoming rows to `any` then coerce into `GameRow`
  const byWeek = new Map<number, GameRow[]>()
  ;(data as any[] | null)?.forEach((row) => {
    const g: GameRow = {
      id: row.id,
      kickoff_at: row.kickoff_at,
      home: { short_name: row.home?.[0]?.short_name ?? row.home?.short_name },
      away: { short_name: row.away?.[0]?.short_name ?? row.away?.short_name },
      week: { week_number: row.week?.[0]?.week_number ?? row.week?.week_number },
    }
    const w = g.week.week_number
    if (!byWeek.has(w)) byWeek.set(w, [])
    byWeek.get(w)!.push(g)
  })

  const weeks = Array.from({ length: 22 }, (_, i) => i + 1)

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Calendario NFL 2025</h1>
        <p className="text-sm text-gray-500">Horas en <b>México (CDMX)</b>.</p>
      </header>

      <div className="grid gap-4">
        {weeks.map((w) => {
          const games = byWeek.get(w) ?? []
          return (
            <details key={w} open={games.length > 0} className="border rounded-2xl shadow-sm overflow-hidden">
              <summary className="list-none cursor-pointer">
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <h2 className="text-lg font-semibold">Semana {w}</h2>
                  <span className="text-xs text-gray-500">
                    {games.length ? `${games.length} partidos` : "Sin partidos cargados aún"}
                  </span>
                </div>
              </summary>

              {games.length === 0 ? (
                <div className="px-4 py-8 text-sm text-gray-500">Nada por aquí todavía…</div>
              ) : (
                <ul className="divide-y">
                  {games.map((g) => (
                    <li key={g.id} className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <TeamChip short={g.away.short_name} />
                        <span className="text-gray-500">@</span>
                        <TeamChip short={g.home.short_name} />
                      </div>
                      <div className="text-sm text-gray-800 font-medium">
                        {fmtMX(g.kickoff_at)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </details>
          )
        })}
      </div>
    </main>
  )
}
