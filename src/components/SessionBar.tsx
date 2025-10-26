"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function SessionBar() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = supabaseBrowser();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      // ✅ Incluimos el token
      const res = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setUser(json.data);
      } else {
        console.error("⚠️ Error al obtener usuario:", res.status);
        if (res.status === 401) router.push("/login");
      }
    })();
  }, [router]);

  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <div>👋 Hola, {user?.name ?? "Usuario"}</div>
      <button
        onClick={async () => {
          const supabase = supabaseBrowser();
          await supabase.auth.signOut();
          router.refresh();
          router.push("/login");
        }}
        className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
