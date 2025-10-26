// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { assertUser } from "@/lib/auth/guard";

export async function GET(req: Request) {
  try {
    const user = await assertUser(req);
    return NextResponse.json({ ok: true, data: user });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
}
