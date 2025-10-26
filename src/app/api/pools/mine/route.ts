import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { assertUser } from "@/lib/auth/guard";

export async function GET(req: Request) {
  const user = await assertUser(req);

  const { data, error } = await supabaseService()
    .from("user_pools")
    .select("pool_id, pools(id, name)")
    .eq("user_id", user.id);

  if (error) {
    console.error("❌ Error al traer pools:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pools =
    data?.map((r) => ({
      id: r.pools?.id,
      name: r.pools?.name,
    })) ?? [];

  return NextResponse.json({ pools });
}
