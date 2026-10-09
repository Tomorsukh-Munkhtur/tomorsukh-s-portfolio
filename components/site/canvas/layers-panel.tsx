"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { PAGE_IDS, type CardBox, type FrameBox, type PageId } from "@/lib/canvas-layout";
import { localePath, t } from "@/lib/i18n";
import { cn, pad } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { cardLayer, frameLayer } from "./frames";

function FrameIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <rect x="2.5" y="3" width="11" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="m3 11.5 3.2-3.2 2.3 2.3 1.7-1.7 2.8 2.6" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="10.5" cy="6" r="1" fill="currentColor" />
    </svg>
  );
}

const rowBase = "flex w-full items-center gap-2 rounded-md text-left transition-colors";

/**
 * Figma-style left panel: file header, pages, and the layer tree of the
 * current page (frames and their projects). Hovering a layer highlights it on
 * the canvas; clicking flies there.
 */
export function LayersPanel({
  name,
  role,
  page,
  frames,
  selected,
  onPage,
  onFrame,
  onCard,
  onHover,
  header,
  footer,
}: {
  name: string;
  role: string;
  page: PageId;
  frames: FrameBox[];
  selected: string | null;
  onPage: (page: PageId) => void;
  onFrame: (frame: FrameBox) => void;
  onCard: (frame: FrameBox, card: CardBox) => void;
  onHover: (layer: string | null) => void;
  header?: ReactNode;
  footer?: ReactNode;
}) {
  const { locale, dict } = useLocale();
  const total = frames.reduce((n, f) => n + f.cards.length, 0);
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(total > 14 ? frames.filter((f) => f.cards.length).map((f) => f.id) : []),
  );
  const toggle = (id: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-elev text-[13px] shadow-2xl">
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-fg text-sm font-semibold text-bg">
          {name.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <p className="truncate text-xs text-muted">{role}</p>
        </div>
        {header}
      </div>

      <nav aria-label={dict.canvas.pages} className="border-b border-line p-2">
        <p className="px-2 py-1 text-[11px] font-medium text-muted">{dict.canvas.pages}</p>
        {PAGE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onPage(id)}
            aria-current={id === page ? "page" : undefined}
            className={cn(rowBase, "px-2 py-1.5", id === page ? "font-medium text-fg" : "text-muted hover:bg-fg/8 hover:text-fg")}
          >
            <span className="w-3.5 text-center text-[11px]">{id === page ? "✓" : ""}</span>
            {dict.canvas.pageNames[id]}
          </button>
        ))}
      </nav>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2" onPointerLeave={() => onHover(null)}>
        <p className="px-2 py-1 text-[11px] font-medium text-muted">{dict.canvas.layers}</p>
        <ul>
          {frames.map((f) => {
            const open = !collapsed.has(f.id);
            const frameSel = selected === frameLayer(f.id);
            return (
              <li key={f.id}>
                <div
                  className={cn(rowBase, "group/row pr-2", frameSel ? "bg-fg/15 text-fg" : "hover:bg-fg/8")}
                  onPointerEnter={() => onHover(frameLayer(f.id))}
                >
                  <button
                    type="button"
                    onClick={() => f.cards.length && toggle(f.id)}
                    aria-label={open ? "Collapse" : "Expand"}
                    aria-expanded={f.cards.length ? open : undefined}
                    className={cn("grid h-7 w-6 shrink-0 place-items-center text-faint", !f.cards.length && "invisible")}
                  >
                    <svg viewBox="0 0 10 10" className={cn("size-2 transition-transform", open && "rotate-90")} aria-hidden>
                      <path d="m3 1.5 4 3.5-4 3.5z" fill="currentColor" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => onFrame(f)} className="flex h-7 min-w-0 flex-1 items-center gap-2 text-left">
                    <FrameIcon />
                    <span className="truncate font-medium">{f.title}</span>
                    {f.count !== undefined && <span className="ml-auto font-mono text-[10px] text-faint">{pad(f.count)}</span>}
                  </button>
                </div>
                {open && f.cards.length > 0 && (
                  <ul>
                    {f.cards.map((c) => {
                      const id = cardLayer(c.project.id);
                      return (
                        <li
                          key={c.project.id}
                          onPointerEnter={() => onHover(id)}
                          className={cn(
                            rowBase,
                            "group/row pr-1 pl-8",
                            selected === id ? "bg-fg/15 text-fg" : "text-muted hover:bg-fg/8 hover:text-fg",
                          )}
                        >
                          <button type="button" onClick={() => onCard(f, c)} className="flex h-7 min-w-0 flex-1 items-center gap-2 text-left">
                            <ImageIcon />
                            <span className="truncate">{t(c.project, "title", locale)}</span>
                          </button>
                          <Link
                            href={localePath(locale, `/work/${c.project.slug}`)}
                            aria-label={`${dict.canvas.open}: ${t(c.project, "title", locale)}`}
                            title={dict.canvas.open}
                            className="grid size-6 shrink-0 place-items-center rounded opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-fg/10 focus-visible:opacity-100"
                          >
                            ↗
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {footer && <div className="border-t border-line p-2">{footer}</div>}
    </aside>
  );
}
