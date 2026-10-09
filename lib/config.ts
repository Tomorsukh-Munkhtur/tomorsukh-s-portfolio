export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

/** Without Supabase credentials the site runs in demo mode with sample content. */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export const STORAGE_BUCKET = "portfolio";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Cache tag shared by every piece of public content. */
export const CONTENT_TAG = "portfolio";
