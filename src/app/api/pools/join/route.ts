import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/service";

/**
 * POST /api/pools/join
 * Une al usuario autenticado a una liga (pool)
 */
export async function POST(req: Request) {
  try {
    const { pool_id } = await req.json();

    if (!pool_id) {
      console.warn("⚠️ pool_id requerido");
      return NextResponse.json({ error: "pool_id requerido" }, { status: 400 });
    }

    // ✅ Detectar el dominio automáticamente (local o Vercel)
    const origin =
      req.headers.get("origin") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");

    console.log("🌐 Detectado origin:", origin);

    // ✅ Obtener el usuario autenticado usando el endpoint /api/auth/me
    const userRes = await fetch(`${origin}/api/auth/me`, {
      headers: { Cookie: req.headers.get("cookie") ?? "" },
      cache: "no-store",
    });

    if (!userRes.ok) {
      console.warn("⚠️ No autenticado en /api/auth/me");
      return NextResponse.json(
        { error: "Usuario no autenticado" },
        { status: 401 }
      );
    }

    const { user } = await userRes.json();

    if (!user?.id) {
      console.error("❌ No se recibió user.id desde /api/auth/me");
      return NextResponse.json(
        { error: "Usuario inválido o no encontrado" },
        { status: 401 }
      );
    }

    console.log("🧠 Usuario autenticado:", user.email || user.name);

    const supabase = supabaseService();

    // Verificar si ya pertenece a la liga
    const { data: existing, error: existingErr } = await supabase
      .from("user_pools")
      .select("id")
      .eq("user_id", user.id)
      .eq("pool_id", pool_id)
      .maybeSingle();

    if (existingErr) {
      console.error("⚠️ Error al verificar user_pools:", existingErr);
      return NextResponse.json(
        { error: existingErr.message },
        { status: 500 }
      );
    }

    if (existing) {
      console.log("ℹ️ Ya pertenece a la liga:", pool_id);
      return NextResponse.json({
        ok: true,
        message: "Ya pertenecía a la liga",
      });
    }

    // Insertar relación en user_pools
    const { error: insertErr } = await supabase
      .from("user_pools")
      .insert([{ user_id: user.id, pool_id }]);

    if (insertErr) {
      console.error("❌ Error al insertar en user_pools:", insertErr);
      return NextResponse.json(
        { error: insertErr.message, details: insertErr },
        { status: 500 }
      );
    }

    console.log(`✅ ${user.email || user.name} se unió a la liga ${pool_id}`);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("🔥 Error general en /api/pools/join:", err);
    return NextResponse.json(
      { error: err?.message ?? "Error interno" },
      { status: 500 }
    );
  }
}
