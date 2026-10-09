import { cacheLife, cacheTag } from "next/cache";
import { CONTENT_TAG, isSupabaseConfigured } from "./config";
import { demoCategories, demoProjects, demoSettings } from "./demo-data";
import { createPublicClient } from "./supabase/public";
import type { Category, Project, Settings } from "./types";

/*
 * Public content reads. Every function is cached and tagged with CONTENT_TAG;
 * admin Server Actions call updateTag(CONTENT_TAG) after each change so the
 * site updates immediately.
 */

export const emptySettings: Settings = {
  ...demoSettings,
  name: "",
  name_mn: "",
  name_script: "",
  role_mn: "",
  role_en: "",
  tagline_mn: "",
  tagline_en: "",
  intro_mn: "",
  intro_en: "",
  about_mn: "",
  about_en: "",
  services_mn: "",
  services_en: "",
  location_mn: "",
  location_en: "",
  email: "",
  phone: "",
  socials: [],
};

/** Fill defaults for columns that may be missing or null in older databases. */
export function normalizeSettings(data: Partial<Settings> | null): Settings {
  return {
    ...emptySettings,
    ...data,
    socials: data?.socials ?? [],
    canvas_bg: { ...emptySettings.canvas_bg, ...(data?.canvas_bg ?? {}) },
  };
}

export function normalizeProject(row: Partial<Project>): Project {
  return {
    ...(row as Project),
    tools: row.tools ?? [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
  };
}

export async function getSettings(): Promise<Settings> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");

  if (!isSupabaseConfigured) return demoSettings;

  const { data, error } = await createPublicClient()
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  return normalizeSettings(data);
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");

  if (!isSupabaseConfigured) return demoCategories;

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("id, slug, name_mn, name_en, sort_order")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return data;
}

/** Published projects in display order. */
export async function getProjects(): Promise<Project[]> {
  "use cache";
  cacheTag(CONTENT_TAG);
  cacheLife("hours");

  if (!isSupabaseConfigured) return demoProjects;

  const { data, error } = await createPublicClient()
    .from("projects")
    .select("*")
    .eq("published", true)
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return data.map(normalizeProject);
}

export async function getProject(slug: string) {
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  return {
    project: projects[index],
    next: projects.length > 1 ? projects[(index + 1) % projects.length] : null,
  };
}
