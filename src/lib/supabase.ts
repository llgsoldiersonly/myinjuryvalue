import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _admin: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    // Bypass Next.js's fetch data cache so server-rendered dashboard pages
    // always see the freshest rows. Without this, supabase-js fetches get
    // memoized by the framework and recently-inserted rows can stay invisible
    // for tens of seconds even though they're persisted in the DB.
    global: {
      fetch: (input, init) =>
        fetch(input as RequestInfo, { ...(init ?? {}), cache: "no-store" }),
    },
  });
  return _admin;
}
