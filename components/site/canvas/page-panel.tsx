"use client";

import { useState } from "react";
import type { PageId } from "@/lib/canvas-layout";
import { isHexColor } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { BACKGROUND_PRESETS, setPagePanelOpen, setVisitorBackground } from "./background";

const THEME_SWATCH = "linear-gradient(135deg, #f5f5f5 50%, #1e1e1e 50%)";

function HexField({ value, onCommit }: { value: string; onCommit: (hex: string) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const hex = `#${draft.replace(/^#/, "").trim()}`.toLowerCase();
    if (isHexColor(hex)) onCommit(hex);
    setDraft(null);
  };
  return (
    <input
      value={draft ?? value.replace("#", "").toUpperCase()}
      onChange={(e) => setDraft(e.target.value.slice(0, 7))}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
      spellCheck={false}
      aria-label="HEX"
      className="h-7 w-full min-w-0 rounded-md bg-transparent px-1.5 font-mono text-xs uppercase outline-none hover:bg-fg/6 focus:bg-fg/8"
    />
  );
}

/**
 * Figma's right-hand "Page → Background" section. `current` is the effective
 * colour ("" = theme default); `overridden` says whether the visitor changed it.
 */
export function PagePanel({
  page,
  current,
  overridden,
  open,
  compact = false,
}: {
  page: PageId;
  current: string;
  overridden: boolean;
  open: boolean;
  compact?: boolean;
}) {
  const { dict } = useLocale();
  const c = dict.canvas;
  const pick = (value: string) => setVisitorBackground(page, value);

  const swatch = (
    <label
      className="relative block size-5 shrink-0 cursor-pointer overflow-hidden rounded-[4px] border border-line-strong"
      style={{ background: current || THEME_SWATCH }}
      title={c.background}
    >
      <input
        type="color"
        value={current || "#1e1e1e"}
        onChange={(e) => pick(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
    </label>
  );

  const presets = (
    <div className="grid grid-cols-9 gap-1.5">
      <button
        type="button"
        onClick={() => pick("theme")}
        title={c.defaultBg}
        aria-label={c.defaultBg}
        className={cn("aspect-square rounded-full border border-line-strong", !current && "ring-2 ring-fg ring-offset-1 ring-offset-elev")}
        style={{ background: THEME_SWATCH }}
      />
      {BACKGROUND_PRESETS.map((hex) => (
        <button
          key={hex}
          type="button"
          onClick={() => pick(hex)}
          title={hex.toUpperCase()}
          aria-label={hex}
          className={cn(
            "aspect-square rounded-full border border-line-strong transition-transform hover:scale-110",
            current === hex && "ring-2 ring-fg ring-offset-1 ring-offset-elev",
          )}
          style={{ background: hex }}
        />
      ))}
    </div>
  );

  const reset = overridden && (
    <button
      type="button"
      onClick={() => setVisitorBackground(page, null)}
      className="mt-2 flex items-center gap-1.5 text-xs text-muted hover:text-fg"
    >
      ↺ {c.resetBg}
    </button>
  );

  if (compact) {
    return (
      <div className="space-y-2 px-1 pb-1">
        <div className="flex items-center gap-2 text-xs text-muted">
          {swatch}
          {c.background}
        </div>
        {presets}
        {reset}
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setPagePanelOpen(true)}
        aria-label={`${c.background} · ${c.expand}`}
        className="flex h-10 items-center gap-2 rounded-xl border border-line bg-elev px-3 text-xs shadow-lg"
      >
        <span className="size-4 rounded-[4px] border border-line-strong" style={{ background: current || THEME_SWATCH }} />
        {c.background}
      </button>
    );
  }

  return (
    <aside className="w-60 rounded-2xl border border-line bg-elev text-[13px] shadow-2xl">
      <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
        <p className="font-semibold">{c.pagePanel}</p>
        <button
          type="button"
          onClick={() => setPagePanelOpen(false)}
          aria-label={c.collapse}
          title={c.collapse}
          className="grid size-6 place-items-center rounded text-muted hover:bg-fg/8 hover:text-fg"
        >
          <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
            <path d="M2 7.5 6 4l4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>
      <div className="p-3">
        <p className="mb-2 text-[11px] font-medium text-muted">{c.background}</p>
        <div className="mb-3 flex items-center gap-1 rounded-lg border border-line px-1.5 py-0.5">
          {swatch}
          {current ? (
            <HexField value={current} onCommit={pick} />
          ) : (
            <span className="px-1.5 py-1.5 text-xs text-muted">{c.defaultBg}</span>
          )}
          <span className="ml-auto pr-1 font-mono text-[11px] text-faint">100%</span>
        </div>
        {presets}
        {reset}
        <p className="mt-3 text-[11px] leading-snug text-faint">{c.bgNote}</p>
      </div>
    </aside>
  );
}
