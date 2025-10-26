"use client";

import { useEffect, useState } from "react";
import PickList from "./_components/PickList";

type Pool = { id: string; name: string };
type GameRow = {
  id: string;
  kickoff_at: string;
  home: { short_name: string };
  away: { short_name: string };
  week: { week_number: number };
};

export default function PicksPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [games, setGames] = useState<GameRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 1️⃣ Traer ligas del usuario
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/pools/mine", { credentials: "include" });
      if (!res.ok) return;
      const json = await res.json();
      setPools(json.pools);
      if (json.pools?.length) setSelectedPool(json.pools[0].id);
    })();
  }, []);

  // 2️⃣ Traer juegos (igual que calendario)
  useEffect(() => {
    (async () => {
      if (!selectedPool) return;
      const res = await fetch("/api/pools/games"); // TODO: endpoint real, placeholder
      if (!res.ok) return;
      const json = await res.json();
      setGames(json.data ?? []);
      setLoading(false);
    })();
  }, [selectedPool]);

  // Agrupar juegos por semana
  const byWeek: Record<number, GameRow[]> = {};
  for (const g of games) {
    const w = g.week?.week_number ?? 0;
    if (!byWeek[w]) byWeek[w] = [];
    byWeek[w].push(g);
  }
  const weeks = Object.keys(byWeek)
    .map((k) => Number(k))
    .sort((a, b) => a - b);

  return (
    <main className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">🏈 Picks</h1>

        {/* 🔽 Selector de liga */}
        {pools.length > 0 ? (
          <select
            value={selectedPool ?? ""}
            onChange={(e) => setSelectedPool(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-gray-500 italic">No perteneces a ninguna liga.</p>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando juegos...</p>
      ) : (
        <PickList weeks={weeks} gamesByWeek={byWeek} />
      )}
    </main>
  );
}
