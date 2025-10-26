import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";
import { assertUser } from "@/lib/auth/guard";

export async function GET(req: Request) {
  const user = await assertUser(req);
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("name");

  if (!table)
    return NextResponse.json({ error: "No se indicó tabla" }, { status: 400 });

  const { data, error } = await supabaseService()
    .from(table)
    .select("*")
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
