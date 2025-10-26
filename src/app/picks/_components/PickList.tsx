"use client";

import { useState, useRef, useEffect } from "react";
import { authFetch } from "@/lib/auth/fetch";

const TEAM_COLOR: Record<string, string> = {
  DAL: "#041E42", PHI: "#004C54", KC: "#E31837", SF: "#AA0000", BUF: "#00338D",
  CLE: "#311D00", NYG: "#0B2265", NYJ: "#125740", GB: "#203731", LAR: "#003594",
  MIN: "#4F2683", SEA: "#002244", TB: "#D50A0A", BAL: "#241773", MIA: "#008E97",
};

function fmtMX(iso: string) {
  const d = new Date(iso);
  const fDate = d.toLocaleDateString("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const fTime = d.toLocaleTimeString("es-MX", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${fDate} • ${fTime}`;
}

function TeamChip({ short }: { short: string }) {
  const bg = TEAM_COLOR[short] ?? "#6B7280";
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold text-white"
      style={{ backgroundColor: bg }}
    >
      {short}
    </span>
  );
}

type GameRow = {
  id: string;
  kickoff_at: string;
  home: { short_name: string };
  away: { short_name: string };
  week?: { week_number: number };
};

export default function PickList({
  weeks,
  gamesByWeek,
  selectedPool,
}: {
  weeks: number[];
  gamesByWeek: Record<number, GameRow[]>;
  selectedPool: string;
}) {
  const [picks, setPicks] = useState<Record<string, -1 | 0 | 1 | 2>>({});
  const timers = useRef<Record<string, any>>({});

  // 🔹 Cargar picks guardados
  useEffect(() => {
    (async () => {
      if (!selectedPool) return;
      try {
        const res = await authFetch(`/api/picks/by_user?pool_id=${selectedPool}`);
        const json = await res.json();
        if (res.ok && json.data) {
          const loaded: Record<string, -1 | 0 | 1 | 2> = {};
          json.data.forEach((p: any) => {
            loaded[p.game_id] = p.prediction;
          });
          setPicks(loaded);
        }
      } catch (err) {
        console.error("❌ Error al cargar picks:", err);
      }
    })();
  }, [selectedPool]);

  // 🔹 Guardado automático con debounce
  async function savePickDebounced(gameId: string, val: 0 | 1 | 2) {
    if (!selectedPool) {
      console.warn("⚠️ No hay liga seleccionada. No se guarda pick aún.");
      return;
    }

    clearTimeout(timers.current[gameId]);
    timers.current[gameId] = setTimeout(async () => {
      try {
        const payload = {
          pool_id: selectedPool,
          picks: [{ game_id: gameId, prediction: val }],
        };
        const res = await authFetch("/api/picks/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          console.log(`💾 Pick guardado (${gameId} → ${val})`);
        } else {
          const text = await res.text();
          console.error(`⚠️ Error al guardar pick (${res.status}):`, text);
          alert(`❌ Error al guardar pick (${res.status}):\n${text}`);
        }
      } catch (err) {
        console.error("❌ Error de red al guardar pick:", err);
      }
    }, 400);
  }

  function handleChange(gameId: string, val: 0 | 1 | 2) {
    setPicks((prev) => ({ ...prev, [gameId]: val }));
    savePickDebounced(gameId, val);
  }

  const getColor = (g: GameRow, val: -1 | 0 | 1 | 2) => {
    if (val === 0) return TEAM_COLOR[g.away.short_name] ?? "#2563EB";
    if (val === 2) return TEAM_COLOR[g.home.short_name] ?? "#DC2626";
    if (val === 1) return "#9CA3AF";
    return "#E5E7EB";
  };

  return (
    <div className="divide-y rounded-md border overflow-hidden">
      {weeks.map((w) => {
        const games = gamesByWeek[w] ?? [];
        return (
          <details key={w} open className="group">
            <summary className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 cursor-pointer">
              <div className="flex items-baseline gap-2">
                <h2 className="text-base font-semibold">Semana {w}</h2>
                <span className="text-xs text-gray-500">
                  {games.length ? `${games.length} partidos` : "Sin partidos"}
                </span>
              </div>
              <span className="text-xs text-gray-400 group-open:hidden">mostrar</span>
              <span className="text-xs text-gray-400 hidden group-open:inline">ocultar</span>
            </summary>

            {games.length === 0 ? (
              <div className="px-4 py-8 text-sm text-gray-500">Nada por aquí todavía…</div>
            ) : (
              <ul className="divide-y">
                {games.map((g) => {
                  const val = picks[g.id] ?? -1;
                  const sliderValue = val < 0 ? 1 : val;
                  const color = getColor(g, val);

                  return (
                    <li key={g.id} className="px-4 py-3 flex flex-col items-center">
                      <div className="flex items-center justify-between w-full max-w-sm">
                        <TeamChip short={g.away.short_name} />
                        <span className="text-gray-500">@</span>
                        <TeamChip short={g.home.short_name} />
                      </div>

                      <div className="mt-3 w-full max-w-sm mx-auto">
                        <input
                          type="range"
                          min={0}
                          max={2}
                          step={1}
                          value={sliderValue}
                          onChange={(e) => handleChange(g.id, Number(e.target.value) as 0 | 1 | 2)}
                          className="w-full h-2 rounded-lg appearance-none transition-all duration-200"
                          style={{ backgroundColor: color }}
                        />

                        <div className="mt-1 grid grid-cols-3 text-[11px] text-gray-600">
                          <span className="text-left">Visitante</span>
                          <span className="text-center">Empate</span>
                          <span className="text-right">Local</span>
                        </div>

                        <div className="mt-1 text-xs text-gray-700">
                          Selección:{" "}
                          {val === -1
                            ? "Sin selección"
                            : val === 0
                            ? g.away.short_name
                            : val === 2
                            ? g.home.short_name
                            : "Empate"}
                        </div>

                        <div className="text-xs text-gray-500 mt-1">
                          {fmtMX(g.kickoff_at)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </details>
        );
      })}
    </div>
  );
}
