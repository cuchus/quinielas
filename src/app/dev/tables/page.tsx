"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/fetch";

type TableInfo = {
  name: string;
  data?: any[];
  error?: string;
};

export default function TablesPage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const tableNames = [
    "users",
    "pools",
    "user_pools",
    "weeks",
    "games",
    "teams",
    "seasons",
    "picks",
  ];

  useEffect(() => {
    (async () => {
      try {
        const results: TableInfo[] = [];
        for (const name of tableNames) {
          const res = await authFetch(`/api/dev/table?name=${name}`);
          const json = await res.json();
          results.push({ name, ...json });
        }
        setTables(results);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main className="p-4">Cargando tablas...</main>;
  if (error) return <main className="p-4 text-red-600">Error: {error}</main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">📊 Tablas (Vista rápida)</h1>

      {tables.map((t) => (
        <section
          key={t.name}
          className="border rounded-md bg-white shadow-sm p-4 overflow-x-auto"
        >
          <h2 className="text-lg font-semibold mb-2">{t.name}</h2>

          {t.error ? (
            <p className="text-sm text-red-600">⚠️ {t.error}</p>
          ) : t.data && t.data.length > 0 ? (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  {Object.keys(t.data[0]).map((col) => (
                    <th key={col} className="border px-2 py-1 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.data.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {Object.keys(row).map((col) => (
                      <td key={col} className="border px-2 py-1">
                        {String(row[col] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">Sin registros</p>
          )}
        </section>
      ))}
    </main>
  );
}
