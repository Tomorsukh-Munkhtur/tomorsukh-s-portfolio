import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-only Supabase client using the service-role key.
// NEVER import this in client components — the service-role key bypasses
// Row Level Security and must stay on the server.
// Created lazily so importing this module never fails during the build step.
let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!admin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      throw new Error(
        'Supabase admin is not configured. Add NEXT_PUBLIC_SUPABASE_URL and ' +
          'SUPABASE_SERVICE_ROLE_KEY to your environment variables.'
      );
    }
    admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }
  return admin;
}

// Checks the Authorization: Bearer <token> header against ADMIN_PASSWORD.
export function isAdminRequest(request: Request): boolean {
  const header = request.headers.get('authorization') ?? '';
  const token = header.replace('Bearer ', '').trim();
  return token.length > 0 && token === process.env.ADMIN_PASSWORD;
}
