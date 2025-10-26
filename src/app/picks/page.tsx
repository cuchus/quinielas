"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/fetch";
import PickList from "./_components/PickList";

export default function PicksPage() {
  const [weeks, setWeeks] = useState<number[]>([]);
  const [gamesByWeek, setGamesByWeek] = useState<Record<number, any[]>>({});
  const [pools, setPools] = useState<any[]>([]);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // 🟦 1. Cargar las ligas del usuario
        const resPools = await authFetch("/api/pools/mine");
        const jsonPools = await resPools.json();
        setPools(jsonPools.data ?? []);
        if (jsonPools.data?.length > 0) {
          setSelectedPool(jsonPools.data[0].id); // selecciona la primera liga
        }

        // 🟩 2. Cargar semanas y juegos
        const resGames = await authFetch("/api/games/all");
        const jsonGames = await resGames.json();

        // Agrupar los juegos por semana
        const byWeek: Record<number, any[]> = {};
        jsonGames.data?.forEach((g: any) => {
          const week = g.week?.week_number ?? 0;
          if (!byWeek[week]) byWeek[week] = [];
          byWeek[week].push(g);
        });

        setWeeks(Object.keys(byWeek).map(Number).sort((a, b) => a - b));
        setGamesByWeek(byWeek);
      } catch (err) {
        console.error("❌ Error cargando datos:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="p-6">Cargando tus picks...</main>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        🏈 Picks
      </h1>

      {/* Selector de liga */}
      {pools.length > 0 ? (
        <div className="flex items-center gap-3">
          <label htmlFor="pool" className="text-sm text-gray-700 font-medium">
            Liga:
          </label>
          <select
            id="pool"
            className="border rounded-md px-2 py-1 text-sm"
            value={selectedPool ?? ""}
            onChange={(e) => setSelectedPool(e.target.value)}
          >
            {pools.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <p className="text-gray-600 text-sm">
          No perteneces a ninguna liga todavía.
        </p>
      )}

      {/* Lista de picks */}
      {selectedPool ? (
        <PickList
          weeks={weeks}
          gamesByWeek={gamesByWeek}
          selectedPool={selectedPool}
        />
      ) : (
        <p className="text-gray-500 text-sm">
          Selecciona una liga para ver y guardar tus picks.
        </p>
      )}
    </main>
  );
}
