"use client"

import { useEffect, useMemo, useState } from "react"

export type Prediction = "H" | "A" | "T"

export type TeamInfo = {
  id: string
  name: string
  short_name: string
}

export type WeekGame = {
  id: string
  kickoff_at: string
  status: string
  tieFlag: boolean
  weekNumber: number
  home: TeamInfo
  away: TeamInfo
}

export type WeekGroup = {
  weekNumber: number
  games: WeekGame[]
}

export type PoolMember = {
  id: string
  name: string
}

export type PoolWithMembers = {
  id: string
  name: string
  members: PoolMember[]
}

export type PickItem = {
  pool_id: string
  user_id: string
  game_id: string
  prediction: Prediction
}

type PicksState = Record<string, Record<string, Record<string, Prediction>>>

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
  GB: "#203731",
  HOU: "#03202F",
  IND: "#002C5F",
  JAX: "#006778",
  KC: "#E31837",
  LV: "#000000",
  LAC: "#0080C6",
  LAR: "#003594",
  MIA: "#008E97",
  MIN: "#4F2683",
  NE: "#002244",
  NO: "#D3BC8D",
  NYG: "#0B2265",
  NYJ: "#125740",
  PHI: "#004C54",
  PIT: "#FFB612",
  SF: "#AA0000",
  SEA: "#002244",
  TB: "#D50A0A",
  TEN: "#4B92DB",
  WAS: "#5A1414",
}

const PREDICTION_OPTIONS: { value: Prediction; label: string }[] = [
  { value: "A", label: "Visita" },
  { value: "H", label: "Local" },
  { value: "T", label: "Empate" },
]

const mxDate = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  weekday: "short",
  day: "2-digit",
  month: "short",
})

const mxTime = new Intl.DateTimeFormat("es-MX", {
  timeZone: "America/Mexico_City",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
})

function buildState(picks: PickItem[]): PicksState {
  const result: PicksState = {}
  for (const pick of picks) {
    const poolState = result[pick.pool_id] ?? {}
    const userState = poolState[pick.user_id] ?? {}
    userState[pick.game_id] = pick.prediction
    poolState[pick.user_id] = userState
    result[pick.pool_id] = poolState
  }
  return result
}

function formatKickoff(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "Por definir"
  return `${mxDate.format(date)} - ${mxTime.format(date)}`
}

function TeamChip({ short, name }: { short: string; name: string }) {
  const label = short || "TBD"
  const bg = TEAM_COLOR[short] ?? "#4B5563"
  const { r, g, b } = hexToRgb(bg)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  const light = lum > 0.6
  return (
    <span
      className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: bg, color: light ? "#000" : "#fff" }}
      title={name || label}
    >
      <span
        aria-hidden
        className="inline-block h-3 w-3 rounded-full ring-2"
        style={{ backgroundColor: light ? "#000" : "#fff", opacity: 0.85 }}
      />
      {label}
    </span>
  )
}

function hexToRgb(hex: string) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!match) return { r: 0, g: 0, b: 0 }
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16),
  }
}

function statusLabel(status: string) {
  if (!status) return ""
  const lower = status.toLowerCase()
  if (lower === "scheduled") return "Programado"
  if (lower === "final") return "Final"
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

type Props = {
  weeks: WeekGroup[]
  pools: PoolWithMembers[]
  picks: PickItem[]
}

const PicksBoard = ({ weeks, pools, picks }: Props) => {
  const membersByPool = useMemo(() => new Map(pools.map((pool) => [pool.id, pool.members])), [pools])

  const [selectedPool, setSelectedPool] = useState<string | undefined>(pools[0]?.id)
  const [selectedUser, setSelectedUser] = useState<string | undefined>(pools[0]?.members[0]?.id)
  const baseState = useMemo(() => buildState(picks), [picks])
  const [localPicks, setLocalPicks] = useState<PicksState>(baseState)
  const [pendingGameId, setPendingGameId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [lastSavedGameId, setLastSavedGameId] = useState<string | null>(null)

  useEffect(() => {
    setLocalPicks(baseState)
  }, [baseState])

  useEffect(() => {
    if (!pools.length) {
      setSelectedPool(undefined)
      setSelectedUser(undefined)
      return
    }

    if (!selectedPool || !pools.some((pool) => pool.id === selectedPool)) {
      setSelectedPool(pools[0]?.id)
      setSelectedUser(pools[0]?.members[0]?.id)
      return
    }

    const members = membersByPool.get(selectedPool) ?? []
    if (!selectedUser || !members.some((member) => member.id === selectedUser)) {
      setSelectedUser(members[0]?.id)
    }
  }, [membersByPool, pools, selectedPool, selectedUser])

  useEffect(() => {
    if (!lastSavedGameId) return
    const timer = setTimeout(() => setLastSavedGameId(null), 1600)
    return () => clearTimeout(timer)
  }, [lastSavedGameId])

  const activeMembers = selectedPool ? membersByPool.get(selectedPool) ?? [] : []

  const handlePick = async (gameId: string, prediction: Prediction) => {
    if (!selectedPool || !selectedUser) return
    const current = localPicks[selectedPool]?.[selectedUser]?.[gameId]
    if (current === prediction) return

    setErrorMessage(null)
    setPendingGameId(gameId)

    const previous = current ?? null
    setLocalPicks((prev) => {
      const next = { ...prev }
      const poolState = { ...(next[selectedPool] ?? {}) }
      const userState = { ...(poolState[selectedUser] ?? {}) }
      userState[gameId] = prediction
      poolState[selectedUser] = userState
      next[selectedPool] = poolState
      return next
    })

    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pool_id: selectedPool,
          user_id: selectedUser,
          game_id: gameId,
          prediction,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setLastSavedGameId(gameId)
    } catch (error) {
      console.error(error)
      setErrorMessage("No pudimos guardar tu pick. Intenta de nuevo.")
      setLocalPicks((prev) => {
        const next = { ...prev }
        const poolState = { ...(next[selectedPool] ?? {}) }
        const userState = { ...(poolState[selectedUser] ?? {}) }

        if (previous) {
          userState[gameId] = previous
        } else {
          delete userState[gameId]
        }

        if (Object.keys(userState).length === 0) {
          delete poolState[selectedUser]
        } else {
          poolState[selectedUser] = userState
        }

        if (Object.keys(poolState).length === 0) {
          delete next[selectedPool]
        } else {
          next[selectedPool] = poolState
        }

        return next
      })
    } finally {
      setPendingGameId(null)
    }
  }

  if (!pools.length) {
    return (
      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
        Aun no hay pools registradas. Crea una para comenzar a capturar picks.
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:w-60">
            Pool
            <select
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-black focus:outline-none"
              value={selectedPool ?? ""}
              onChange={(event) => setSelectedPool(event.target.value || undefined)}
            >
              {pools.map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm font-medium text-gray-700 sm:w-60">
            Participante
            <select
              className="h-10 rounded-lg border border-gray-300 px-3 text-sm focus:border-black focus:outline-none"
              value={selectedUser ?? ""}
              onChange={(event) => setSelectedUser(event.target.value || undefined)}
              disabled={!activeMembers.length}
            >
              {activeMembers.length === 0 ? (
                <option value="">Sin participantes</option>
              ) : (
                activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>

        {activeMembers.length === 0 && (
          <p className="mt-3 text-xs text-yellow-700">
            Agrega participantes a este pool para poder capturar picks.
          </p>
        )}

        <p className="mt-4 text-xs text-gray-500">
          Al elegir un ganador se guarda en automatico para ese participante.
        </p>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {lastSavedGameId && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Pick guardado.
        </div>
      )}

      {weeks.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600">
          No hay partidos cargados todavia.
        </section>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => {
            const games = week.games
            const optionsForWeek = (game: WeekGame) =>
              game.tieFlag ? PREDICTION_OPTIONS : PREDICTION_OPTIONS.filter((option) => option.value !== "T")

            return (
              <details
                key={week.weekNumber}
                open={games.length > 0}
                className="overflow-hidden rounded-2xl border bg-white shadow-sm"
              >
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                    <h2 className="text-lg font-semibold">Semana {week.weekNumber}</h2>
                    <span className="text-xs text-gray-500">
                      {games.length} partido{games.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </summary>

                {games.length === 0 ? (
                  <div className="px-4 py-8 text-sm text-gray-500">Nada por aqui todavia.</div>
                ) : (
                  <ul className="divide-y">
                    {games.map((game) => {
                      const current =
                        selectedPool &&
                        selectedUser &&
                        localPicks[selectedPool]?.[selectedUser]?.[game.id]
                      const isSaving = pendingGameId === game.id
                      const disabled = !selectedPool || !selectedUser || isSaving
                      const options = optionsForWeek(game)

                      return (
                        <li key={game.id} className="space-y-3 px-4 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <TeamChip short={game.away.short_name} name={game.away.name} />
                            <span className="text-sm text-gray-500">@</span>
                            <TeamChip short={game.home.short_name} name={game.home.name} />
                            <span className="text-xs text-gray-400">{formatKickoff(game.kickoff_at)}</span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                              {statusLabel(game.status)}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {options.map((option) => {
                              const active = current === option.value
                              const baseClasses = "min-w-[88px] rounded-full border px-4 py-2 text-sm font-medium transition"
                              const stateClasses = active
                                ? " border-black bg-black text-white"
                                : " border-gray-300 bg-white text-gray-700 hover:border-black"
                              const disabledClasses = disabled ? " cursor-not-allowed opacity-60" : ""

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handlePick(game.id, option.value)}
                                  disabled={disabled}
                                  className={baseClasses + stateClasses + disabledClasses}
                                >
                                  {option.label}
                                  {isSaving && active ? "..." : ""}
                                </button>
                              )
                            })}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PicksBoard
