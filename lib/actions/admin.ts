"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAuthState, type AuthState } from "../auth";
import { CONTENT_TAG, STORAGE_BUCKET } from "../config";
import { createSupabaseServer } from "../supabase/server";
import type { ImageAsset } from "../types";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

const DEMO_ERROR = "Демо горим: Supabase холбогдоогүй тул өөрчлөлт хадгалагдахгүй.";

type Admin = Extract<AuthState, { status: "admin" }>;

/** Re-checks the session on every action — Server Actions are public endpoints. */
async function authorize(): Promise<Admin | { error: string }> {
  const state = await getAuthState();
  if (state.status === "demo") return { error: DEMO_ERROR };
  if (state.status !== "admin") return { error: "Нэвтрэх эрх дууссан байна. Дахин нэвтэрнэ үү." };
  return state;
}

function published() {
  updateTag(CONTENT_TAG);
  refresh();
}

const fail = (error: string): ActionResult<never> => ({ ok: false, error });

function dbError(error: { code?: string; message: string }) {
  if (error.code === "23505") return fail("Энэ slug (URL нэр) аль хэдийн ашиглагдсан байна.");
  console.error(error);
  return fail(`Алдаа: ${error.message}`);
}

async function removeFiles(admin: Admin, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await admin.supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) console.error("Failed to remove files:", error.message);
}

const assetPaths = (assets: (ImageAsset | null | undefined)[]) =>
  assets.map((a) => a?.path).filter((p): p is string => Boolean(p));

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export type SignInState = { error?: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "И-мэйл болон нууц үгээ оруулна уу." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed")
      return { error: "И-мэйл баталгаажаагүй байна. Supabase → Authentication → Users дээр хэрэглэгчээ баталгаажуулна уу." };
    if (error.code === "invalid_credentials") return { error: "И-мэйл эсвэл нууц үг буруу байна." };
    return { error: `Нэвтэрч чадсангүй: ${error.message}` };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Энэ бүртгэлд админ эрх алга. README-ийн 3-р алхмыг хийнэ үү." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

const imageSchema = z.object({
  url: z.string().min(1).max(1000),
  path: z.string().max(500).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  wide: z.boolean().optional(),
});

const projectSchema = z
  .object({
    id: z.uuid().optional(),
    slug: z
      .string()
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug зөвхөн жижиг латин үсэг, тоо, зураас агуулна."),
    title_mn: z.string().trim().max(200),
    title_en: z.string().trim().max(200),
    summary_mn: z.string().trim().max(600),
    summary_en: z.string().trim().max(600),
    description_mn: z.string().trim().max(20000),
    description_en: z.string().trim().max(20000),
    role_mn: z.string().trim().max(200),
    role_en: z.string().trim().max(200),
    client: z.string().trim().max(200),
    year: z.number().int().min(1950).max(2100).nullable(),
    tools: z.array(z.string().trim().min(1).max(60)).max(30),
    category_id: z.uuid().nullable(),
    cover: imageSchema.nullable(),
    gallery: z.array(imageSchema).max(80),
    external_url: z.union([z.literal(""), z.url()]),
    featured: z.boolean(),
    published: z.boolean(),
  })
  .refine((p) => p.title_mn || p.title_en, { message: "Гарчгийг дор хаяж нэг хэлээр бичнэ үү." });

export type ProjectInput = z.input<typeof projectSchema>;

export async function saveProject(input: ProjectInput): Promise<ActionResult<{ id: string }>> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Буруу өгөгдөл.");
  const { id, ...values } = parsed.data;

  if (id) {
    const { data: before } = await admin.supabase
      .from("projects")
      .select("cover, gallery")
      .eq("id", id)
      .maybeSingle();

    const { error } = await admin.supabase.from("projects").update(values).eq("id", id);
    if (error) return dbError(error);

    // Delete files that are no longer referenced by the project.
    if (before) {
      const keep = new Set(assetPaths([values.cover, ...values.gallery]));
      const old = assetPaths([before.cover as ImageAsset | null, ...((before.gallery as ImageAsset[]) ?? [])]);
      await removeFiles(admin, old.filter((p) => !keep.has(p)));
    }
    published();
    return { ok: true, data: { id } };
  }

  // New projects go to the top of the list.
  const { data: first } = await admin.supabase
    .from("projects")
    .select("sort_order")
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  const { data, error } = await admin.supabase
    .from("projects")
    .insert({ ...values, sort_order: (first?.sort_order ?? 1) - 1 })
    .select("id")
    .single();
  if (error) return dbError(error);
  published();
  return { ok: true, data: { id: data.id } };
}

export async function deleteProject(id: string): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);

  const { data: project } = await admin.supabase
    .from("projects")
    .select("cover, gallery")
    .eq("id", id)
    .maybeSingle();
  const { error } = await admin.supabase.from("projects").delete().eq("id", id);
  if (error) return dbError(error);

  if (project) {
    await removeFiles(admin, assetPaths([project.cover as ImageAsset | null, ...((project.gallery as ImageAsset[]) ?? [])]));
  }
  published();
  return { ok: true };
}

export async function setProjectFlag(
  id: string,
  flag: "published" | "featured",
  value: boolean,
): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const { error } = await admin.supabase.from("projects").update({ [flag]: value }).eq("id", id);
  if (error) return dbError(error);
  published();
  return { ok: true };
}

async function reorder(table: "projects" | "categories", ids: string[]): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  if (!z.array(z.uuid()).max(500).safeParse(ids).success) return fail("Буруу өгөгдөл.");

  const results = await Promise.all(
    ids.map((id, index) => admin.supabase.from(table).update({ sort_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return dbError(failed.error);
  published();
  return { ok: true };
}

export async function reorderProjects(ids: string[]) {
  return reorder("projects", ids);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

const categorySchema = z.object({
  id: z.uuid().optional(),
  slug: z.string().max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug буруу байна."),
  name_mn: z.string().trim().min(1, "Монгол нэрийг бичнэ үү.").max(80),
  name_en: z.string().trim().max(80),
});

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Буруу өгөгдөл.");

  const { id, ...values } = parsed.data;
  const { error } = id
    ? await admin.supabase.from("categories").update(values).eq("id", id)
    : await admin.supabase.from("categories").insert({ ...values, sort_order: 999 });
  if (error) return dbError(error);
  published();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const { error } = await admin.supabase.from("categories").delete().eq("id", id);
  if (error) return dbError(error);
  published();
  return { ok: true };
}

export async function reorderCategories(ids: string[]) {
  return reorder("categories", ids);
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export async function setMessageRead(id: string, read: boolean): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const { error } = await admin.supabase.from("messages").update({ read }).eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const { error } = await admin.supabase.from("messages").delete().eq("id", id);
  if (error) return dbError(error);
  refresh();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const text = (max: number) => z.string().trim().max(max);
const hexOrEmpty = z.union([z.literal(""), z.string().regex(/^#[0-9a-f]{6}$/i, "Өнгө #RRGGBB хэлбэртэй байна.")]);

const settingsSchema = z.object({
  name: text(80).min(1, "Нэрээ бичнэ үү."),
  name_mn: text(80),
  name_script: text(120),
  role_mn: text(120),
  role_en: text(120),
  tagline_mn: text(240),
  tagline_en: text(240),
  intro_mn: text(600),
  intro_en: text(600),
  about_mn: text(6000),
  about_en: text(6000),
  services_mn: text(1500),
  services_en: text(1500),
  location_mn: text(120),
  location_en: text(120),
  email: z.union([z.literal(""), z.email()]),
  phone: text(40),
  avatar: imageSchema.nullable(),
  socials: z.array(z.object({ label: text(40).min(1), url: z.url() })).max(12),
  available: z.boolean(),
  // Empty = monochrome accent.
  accent: z.union([z.literal(""), z.string().regex(/^#[0-9a-f]{6}$/i, "Өнгө #RRGGBB хэлбэртэй байна.")]),
  // Per-page canvas background; empty = the theme's default grey.
  canvas_bg: z.object({ work: hexOrEmpty, about: hexOrEmpty, contact: hexOrEmpty }),
});

export type SettingsInput = z.input<typeof settingsSchema>;

export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  const admin = await authorize();
  if ("error" in admin) return fail(admin.error);
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Буруу өгөгдөл.");

  const { data: before } = await admin.supabase.from("site_settings").select("avatar").eq("id", 1).maybeSingle();
  const { error } = await admin.supabase.from("site_settings").update(parsed.data).eq("id", 1);
  if (error) return dbError(error);

  const oldPath = (before?.avatar as ImageAsset | null)?.path;
  if (oldPath && oldPath !== parsed.data.avatar?.path) await removeFiles(admin, [oldPath]);
  published();
  return { ok: true };
}
