import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Storage bucket name used for project images.
export const STORAGE_BUCKET = 'project-images';

// Lazily-created browser/client-side Supabase client (uses the public anon key).
// Created on first use so that importing this module never fails during the
// build step when env vars may be absent.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and ' +
          'NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local (and to Vercel env vars).'
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
