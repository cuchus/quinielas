import { NextResponse } from "next/server";
import { assertUser } from "@/lib/auth/guard";
import { supabaseService } from "@/lib/supabase/service";

type Body = {
  pool_id: string;
  picks: Array<{ game_id: string; prediction: number }>;
};

export async function POST(req: Request) {
  const user = await assertUser(req);

  let body: Body | null = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pool_id = body?.pool_id;
  const picks = body?.picks;

  if (!pool_id) {
    return NextResponse.json({ error: "pool_id requerido" }, { status: 400 });
  }
  if (!Array.isArray(picks) || picks.length === 0) {
    return NextResponse.json({ error: "picks[] requerido" }, { status: 400 });
  }

  // Normaliza y valida
  const rows = picks
    .filter((p) => p && typeof p.game_id === "string")
    .map((p) => ({
      user_id: user.id,
      pool_id,
      game_id: p.game_id,
      prediction: Number(p.prediction), // 0,1,2
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: "picks vacíos o inválidos" }, { status: 400 });
  }

  // 🔎 Log para ver lo que está llegando
  console.log("UPSERT picks", rows.slice(0, 3), rows.length, "items");

  const { error } = await supabaseService()
    .from("picks")
    // ⬇️ IMPORTANTE: que coincida con el índice único en tu BD
    .upsert(rows, { onConflict: "user_id,pool_id,game_id" });

  if (error) {
    console.error("❌ Supabase upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
