import type { AdminContext } from "./auth";
import { normalizeProject, normalizeSettings } from "./data";
import { demoCategories, demoProjects, demoSettings } from "./demo-data";
import type { Category, Message, Project, Settings } from "./types";

/*
 * Uncached reads for the admin area. They run with the signed-in user's
 * session, so row level security lets them see drafts, messages and stats.
 * In demo mode they return sample data.
 */

export type CategoryWithCount = Category & { project_count: number };

export type Stats = {
  daily: { day: string; views: number; visitors: number }[];
  views: number;
  visitors: number;
  prevViews: number;
  totalViews: number;
  topProjects: { project_id: string; slug: string; title_mn: string; title_en: string; views: number }[];
  referrers: { source: string; views: number }[];
};

const demoMessages: Message[] = [
  {
    id: "m1",
    name: "Б. Сарнай",
    email: "sarnai@example.com",
    subject: "Брэнд таних тэмдэг",
    body: "Сайн байна уу! Бид шинэ кофе шоп нээх гэж байгаа бөгөөд лого болон брэнд таних тэмдэг хийлгэх сонирхолтой байна. Үнийн санал авч болох уу?",
    read: false,
    created_at: "2026-10-07T09:12:00.000Z",
  },
  {
    id: "m2",
    name: "Alex Kim",
    email: "alex@example.com",
    subject: "App redesign",
    body: "Hi! Loved the Steppe case study. We're redesigning our fitness app and would love to chat about a 3-month engagement.",
    read: false,
    created_at: "2026-10-05T14:40:00.000Z",
  },
  {
    id: "m3",
    name: "Г. Тэмүүлэн",
    email: "temuulen@example.com",
    subject: "Постер",
    body: "Ирэх сард болох хөгжмийн тоглолтын постер хийлгэмээр байна.",
    read: true,
    created_at: "2026-09-28T03:05:00.000Z",
  },
];

function demoStats(days: number): Stats {
  const today = new Date();
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const wave = Math.sin(i / 3.2) * 18 + Math.cos(i / 1.7) * 9;
    const views = Math.max(8, Math.round(62 + wave + i * 1.6 + ((i * 37) % 17)));
    return { day: d.toISOString().slice(0, 10), views, visitors: Math.round(views * 0.62) };
  });
  const views = daily.reduce((s, d) => s + d.views, 0);
  return {
    daily,
    views,
    visitors: Math.round(views * 0.58),
    prevViews: Math.round(views * 0.81),
    totalViews: views * 7,
    topProjects: demoProjects.slice(0, 5).map((p, i) => ({
      project_id: p.id,
      slug: p.slug,
      title_mn: p.title_mn,
      title_en: p.title_en,
      views: Math.round(420 / (i + 1.3)),
    })),
    referrers: [
      { source: "direct", views: 812 },
      { source: "behance.net", views: 403 },
      { source: "instagram.com", views: 266 },
      { source: "google.com", views: 141 },
      { source: "linkedin.com", views: 58 },
    ],
  };
}

export async function getAdminProjects(ctx: AdminContext): Promise<Project[]> {
  if (ctx.demo) return demoProjects;
  const { data, error } = await ctx.supabase
    .from("projects")
    .select("*")
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data.map(normalizeProject);
}

export async function getAdminProject(ctx: AdminContext, id: string): Promise<Project | null> {
  if (ctx.demo) return demoProjects.find((p) => p.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await ctx.supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeProject(data) : null;
}

export async function getAdminCategories(ctx: AdminContext): Promise<CategoryWithCount[]> {
  if (ctx.demo) {
    return demoCategories.map((c) => ({
      ...c,
      project_count: demoProjects.filter((p) => p.category_id === c.id).length,
    }));
  }
  const { data, error } = await ctx.supabase
    .from("categories")
    .select("id, slug, name_mn, name_en, sort_order, projects(count)")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map(({ projects, ...c }) => ({
    ...c,
    project_count: (projects as unknown as { count: number }[])[0]?.count ?? 0,
  }));
}

export async function getMessages(ctx: AdminContext): Promise<Message[]> {
  if (ctx.demo) return demoMessages;
  const { data, error } = await ctx.supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data;
}

export async function getUnreadCount(ctx: AdminContext): Promise<number> {
  if (ctx.demo) return demoMessages.filter((m) => !m.read).length;
  const { count } = await ctx.supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("read", false);
  return count ?? 0;
}

export async function getAdminSettings(ctx: AdminContext): Promise<Settings> {
  if (ctx.demo) return demoSettings;
  const { data, error } = await ctx.supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return normalizeSettings(data);
}

export async function getStats(ctx: AdminContext, days = 30): Promise<Stats> {
  if (ctx.demo) return demoStats(days);

  const [daily, summary, top, refs] = await Promise.all([
    ctx.supabase.rpc("stats_daily", { p_days: days }),
    ctx.supabase.rpc("stats_summary", { p_days: days }),
    ctx.supabase.rpc("stats_top_projects", { p_days: days, p_limit: 6 }),
    ctx.supabase.rpc("stats_referrers", { p_days: days, p_limit: 6 }),
  ]);
  const error = daily.error ?? summary.error ?? top.error ?? refs.error;
  if (error) throw new Error(error.message);

  const s = (summary.data as { views: number; visitors: number; prev_views: number; total_views: number }[])[0];
  return {
    daily: (daily.data as Stats["daily"]).map((d) => ({ ...d, views: Number(d.views), visitors: Number(d.visitors) })),
    views: Number(s?.views ?? 0),
    visitors: Number(s?.visitors ?? 0),
    prevViews: Number(s?.prev_views ?? 0),
    totalViews: Number(s?.total_views ?? 0),
    topProjects: (top.data as Stats["topProjects"]).map((p) => ({ ...p, views: Number(p.views) })),
    referrers: (refs.data as Stats["referrers"]).map((r) => ({ ...r, views: Number(r.views) })),
  };
}
