import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

/**
 * Server-side publishable (anon) client for PUBLIC read-only data.
 * RLS applies as `anon`, so only published products / categories / previews and
 * approved reviews are reachable. Never use this for user-owned data.
 */
export function createPublicServerClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;

  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // sb_* keys are opaque, not JWTs — send them as apikey only.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}
