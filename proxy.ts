import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { defaultLocale, hasLocale, LOCALE_COOKIE, locales } from "@/lib/i18n";
import { updateSession } from "@/lib/supabase/proxy";

function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  if (hasLocale(saved)) return saved;

  const accepted = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());
  return accepted.find(hasLocale) ?? defaultLocale;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return isSupabaseConfigured ? updateSession(request) : NextResponse.next();
  }

  const first = pathname.split("/")[1];
  if ((locales as readonly string[]).includes(first)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Everything except Next internals, API routes and files with an extension.
    "/((?!_next|api|.*\\..*).*)",
  ],
};
