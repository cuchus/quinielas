// src/lib/auth/fetch.ts
import { supabaseBrowser } from "@/lib/supabase/browser";

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const supabase = supabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
  return fetch(input, { ...init, headers });
}
