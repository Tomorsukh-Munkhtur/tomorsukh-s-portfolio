import { redirect } from "next/navigation";
import { cache } from "react";
import { connection } from "next/server";
import { isSupabaseConfigured } from "./config";
import { createSupabaseServer } from "./supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServer>>;

export type AdminContext =
  | { demo: true }
  | { demo: false; supabase: Supabase; userId: string; email: string };

export type AuthState =
  | { status: "demo" }
  | { status: "signed-out" }
  | { status: "forbidden"; email: string }
  | { status: "admin"; supabase: Supabase; userId: string; email: string };

/**
 * Reads the session and checks the `admins` table (deduplicated per request).
 * Never trust the client for this.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  if (!isSupabaseConfigured) return { status: "demo" };

  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return { status: "signed-out" };

  const email = typeof claims.email === "string" ? claims.email : "";
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) return { status: "forbidden", email };

  return { status: "admin", supabase, userId: claims.sub, email };
});

/** For admin pages: returns the context or redirects to the login page. */
export async function requireAdmin(): Promise<AdminContext> {
  // Admin pages are always rendered per request, also in demo mode.
  await connection();
  const state = await getAuthState();
  if (state.status === "demo") return { demo: true };
  if (state.status !== "admin") redirect("/admin/login");
  return { demo: false, supabase: state.supabase, userId: state.userId, email: state.email };
}
