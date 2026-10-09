"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import type { PageId } from "@/lib/canvas-layout";
import { isHexColor } from "@/lib/color";
import type { CanvasBackgrounds } from "@/lib/types";

/*
 * Canvas background per page, Figma-style. The owner sets defaults in the
 * admin; a visitor can override them for themselves (saved in localStorage).
 * A visitor value of "theme" means "use the theme's default grey".
 */

type Prefs = { bgs: Partial<Record<PageId, string>>; panelOpen: boolean };

const KEY = "canvas-bg";
const SERVER: Prefs = { bgs: {}, panelOpen: true };
let prefs: Prefs | null = null;
const listeners = new Set<() => void>();

function load(): Prefs {
  if (prefs) return prefs;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    prefs = { bgs: saved?.bgs ?? {}, panelOpen: saved?.panelOpen ?? true };
  } catch {
    prefs = { ...SERVER };
  }
  return prefs;
}

function save(next: Prefs) {
  prefs = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

export function useCanvasPrefs() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    load,
    () => SERVER,
  );
}

export function setVisitorBackground(page: PageId, value: string | null) {
  const current = load();
  const bgs = { ...current.bgs };
  if (value === null) delete bgs[page];
  else bgs[page] = value;
  save({ ...current, bgs });
}

export function setPagePanelOpen(open: boolean) {
  save({ ...load(), panelOpen: open });
}

/** Effective background for a page: visitor → owner → theme default (""). */
export function effectiveBackground(page: PageId, visitor: Prefs["bgs"], owner: CanvasBackgrounds) {
  const v = visitor[page];
  if (v === "theme") return "";
  if (v && isHexColor(v)) return v;
  return isHexColor(owner[page]) ? owner[page] : "";
}

function luminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Styles for the canvas root: the background plus ink colours for things drawn
 * straight on the canvas (frame labels, dot grid), so they stay readable on
 * any colour. Empty background → theme defaults.
 */
export function canvasStyle(bg: string): CSSProperties | undefined {
  if (!bg) return undefined;
  const light = luminance(bg) > 0.4;
  return {
    backgroundColor: bg,
    ["--canvas-ink" as string]: light ? "#1e1e1e" : "#ffffff",
    ["--canvas-muted" as string]: light ? "rgb(0 0 0 / 0.55)" : "rgb(255 255 255 / 0.62)",
    ["--canvas-faint" as string]: light ? "rgb(0 0 0 / 0.35)" : "rgb(255 255 255 / 0.38)",
    ["--canvas-dot" as string]: light ? "rgb(0 0 0 / 0.2)" : "rgb(255 255 255 / 0.2)",
  };
}

export const BACKGROUND_PRESETS = [
  "#1e1e1e",
  "#f5f5f5",
  "#ffffff",
  "#0c0c0c",
  "#e8e4dc",
  "#1d2433",
  "#23302a",
  "#f3e9e1",
];
