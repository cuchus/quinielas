"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "@/lib/auth/fetch";

export default function JoinPoolPage() {
  const router = useRouter();
  const params = useSearchParams();
  const poolId = params.get("id");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!poolId) {
      setErrorMsg("Liga inválida.");
      return;
    }

    (async () => {
      try {
        const res = await authFetch("/api/pools/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pool_id: poolId }),
        });

        const json = await res.json();

        if (res.ok) {
          setSuccessMsg("🎉 ¡Te has unido a la liga!");
          setTimeout(() => router.push("/picks"), 1500);
        } else {
          console.error("⚠️ Error uniendo:", json);
          setErrorMsg(json.error ?? "Error al unirse a la liga.");
        }
      } catch (err) {
        console.error("🔥 Error general:", err);
        setErrorMsg("Error inesperado al unirse a la liga.");
      }
    })();
  }, [poolId, router]);

  return (
    <main className="max-w-md mx-auto p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Unirse a una liga</h1>
      {errorMsg && <p className="text-red-600">{errorMsg}</p>}
      {successMsg && <p className="text-green-600">{successMsg}</p>}
    </main>
  );
}
