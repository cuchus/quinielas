// src/lib/auth/guard.ts
import { supabaseService } from "@/lib/supabase/service";

export async function assertUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { data: { user }, error } = await supabaseService().auth.getUser(token);
  if (error || !user) throw new Response("Unauthorized", { status: 401 });

  const { data: dbUser, error: dbError } = await supabaseService()
    .from("users")
    .select("id, auth_id, email, name, role")
    .eq("auth_id", user.id)
    .single();

  if (dbError || !dbUser) throw new Response("User not found", { status: 404 });
  return dbUser;
}
