import { NextResponse } from "next/server";
import { assertUser } from "@/lib/auth/guard";
import { supabaseService } from "@/lib/supabase/service";

export async function GET(req: Request) {
  const user = await assertUser(req);
  const { searchParams } = new URL(req.url);
  const pool_id = searchParams.get("pool_id");

  if (!pool_id) {
    return NextResponse.json({ error: "pool_id requerido" }, { status: 400 });
  }

  const { data, error } = await supabaseService()
    .from("picks")
    .select("game_id, prediction")
    .eq("user_id", user.id)
    .eq("pool_id", pool_id);

  if (error) {
    console.error("❌ Error cargando picks:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
