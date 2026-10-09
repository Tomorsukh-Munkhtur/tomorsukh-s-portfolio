import { isSupabaseConfigured } from "@/lib/config";
import { getProjects } from "@/lib/data";
import { createPublicClient } from "@/lib/supabase/public";

const BOT = /bot|crawl|spider|slurp|preview|lighthouse|headless|monitor/i;
const PATH = /^\/(mn|en)(\/[\w\-/]*)?$/;

const noContent = () => new Response(null, { status: 204 });

function referrerHost(referrer: unknown, ownHost: string | null) {
  if (typeof referrer !== "string" || !referrer) return "";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    return host === ownHost?.replace(/^www\./, "").split(":")[0] ? "" : host.slice(0, 200);
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured) return noContent();
  if (BOT.test(request.headers.get("user-agent") ?? "")) return noContent();
  // Don't count the site owner's own visits while signed in to the admin.
  if (/sb-[^=]+-auth-token/.test(request.headers.get("cookie") ?? "")) return noContent();

  const body = await request.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path : "";
  const match = path.length <= 300 ? PATH.exec(path) : null;
  if (!match) return noContent();

  const slug = /^\/work\/([^/]+)$/.exec(match[2] ?? "")?.[1];
  const projectId = slug ? (await getProjects()).find((p) => p.slug === slug)?.id : undefined;

  const { error } = await createPublicClient()
    .from("page_views")
    .insert({
      path,
      locale: match[1],
      project_id: projectId ?? null,
      visitor_id: typeof body?.visitor === "string" ? body.visitor.slice(0, 64) : null,
      referrer: referrerHost(body?.referrer, request.headers.get("host")),
    });
  if (error) console.error("Failed to record page view:", error.message);

  return noContent();
}
