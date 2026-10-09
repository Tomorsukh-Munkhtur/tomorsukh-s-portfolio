"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

let client: ReturnType<typeof createBrowserClient> | undefined;

/** Browser client used by the admin for direct-to-storage uploads. */
export function getSupabaseBrowser() {
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_KEY);
  return client;
}
