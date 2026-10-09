import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

/**
 * Cookie-less client for public reads (safe inside `use cache`) and for
 * anonymous inserts such as contact messages and page views.
 */
export const createPublicClient = () =>
  createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
