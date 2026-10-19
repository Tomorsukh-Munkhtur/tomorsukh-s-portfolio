"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { MAIN_PAGES, WORK_PAGE, type CanvasGroup, type FrameBox, type PageId } from "@/lib/canvas-layout";
import { localePath } from "@/lib/i18n";
import type { ImageAsset } from "@/lib/types";
import { cn, pad } from "@/lib/utils";
import { Img } from "../img";
import { useLocale } from "../locale-provider";
import { Avatar } from "./avatar";
import { frameLayer } from "./frames";

function FrameIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 10 10" className={cn("size-2 shrink-0 transition-transform", open && "rotate-90")} aria-hidden>
      <path d="m3 1.5 4 3.5-4 3.5z" fill="currentColor" />
    </svg>
  );
}

/** A tiny cover in place of the layer icon. */
function Thumb({ cover }: { cover?: ImageAsset | null }) {
  return (
    <span className="relative size-5 shrink-0 overflow-hidden rounded-[4px] bg-fg/10 ring-1 ring-line">
      {/* Only open groups render these, so a handful at most. Eager, because the same cover is the
          page's eager hero artboard and Next would flag it as a lazy LCP image. */}
      {cover && <Img src={cover.url} alt="" fill sizes="40px" loading="eager" className="object-cover" />}
    </span>
  );
}

const rowBase = "flex w-full items-center gap-2 rounded-md text-left transition-colors";
const rowTone = (active: boolean) => (active ? "bg-fg/10 font-medium text-fg" : "text-muted hover:bg-fg/8 hover:text-fg");

/** A project page, as the work tree lists it. */
export type WorkEntry = { id: PageId; title: string; group?: string; slug: string; cover?: ImageAsset | null };

/**
 * Figma-style left panel: file header, the three pages, and the layers of the
 * current page. On the work pages the layers are the whole portfolio as one
 * tree — category → project → its artboards — with the open project expanded.
 */
export function LayersPanel({
  name,
  role,
  avatar,
  onProfile,
  page,
  frames,
  groups,
  work,
  selected,
  onPage,
  onFrame,
  onHover,
  header,
  footer,
  className,
}: {
  name: string;
  role: string;
  avatar?: ImageAsset | null;
  /** Clicking my name and photo brings the cover back. */
  onProfile: () => void;
  page: PageId;
  frames: FrameBox[];
  groups: CanvasGroup[];
  work: WorkEntry[];
  selected: string | null;
  onPage: (page: PageId) => void;
  onFrame: (frame: FrameBox) => void;
  onHover: (layer: string | null) => void;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const { locale, dict } = useLocale();
  const onWork = page === WORK_PAGE || page.startsWith(`${WORK_PAGE}/`);
  const current = work.find((w) => w.id === page);

  // The open project's category starts expanded (the panel remounts per page).
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(current?.group ? [current.group] : []));
  const toggleGroup = (id: string) =>
    setOpenGroups((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const currentRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    currentRow.current?.scrollIntoView({ block: "nearest" });
  }, []);

  const frameRows = (indent: string) =>
    frames.map((f) => (
      <li key={f.id}>
        <button
          type="button"
          onClick={() => onFrame(f)}
          onPointerEnter={() => onHover(frameLayer(f.id))}
          className={cn(
            rowBase,
            "h-7 pr-2",
            indent,
            selected === frameLayer(f.id) ? "bg-fg/15 text-fg" : "text-muted hover:bg-fg/8 hover:text-fg",
          )}
        >
          <FrameIcon />
          <span className="truncate">{f.title}</span>
        </button>
      </li>
    ));

  return (
    <aside
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-2xl border border-line bg-elev text-[13px] shadow-2xl",
        className,
      )}
    >
      <div className="flex items-center gap-1 border-b border-line p-1.5">
        <button
          type="button"
          onClick={onProfile}
          title={dict.canvas.openCover}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-fg/8"
        >
          <Avatar name={name} image={avatar} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{name}</span>
            <span className="block truncate text-xs text-muted">{role}</span>
          </span>
        </button>
        {header}
      </div>

      <nav aria-label={dict.canvas.pages} className="border-b border-line p-2">
        <p className="px-2 py-1 text-[11px] font-medium text-muted">{dict.canvas.pages}</p>
        {MAIN_PAGES.map((id) => {
          const active = id === WORK_PAGE ? onWork : id === page;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onPage(id)}
              aria-current={active ? "page" : undefined}
              className={cn(rowBase, "px-2 py-1.5", active ? "font-medium text-fg" : "text-muted hover:bg-fg/8 hover:text-fg")}
            >
              <span className="w-3.5 text-center text-[11px]">{active ? "✓" : ""}</span>
              {dict.canvas.pageNames[id]}
            </button>
          );
        })}
      </nav>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2" onPointerLeave={() => onHover(null)}>
        <p className="px-2 py-1 text-[11px] font-medium text-muted">{dict.canvas.layers}</p>
        {!onWork ? (
          <ul>{frameRows("pl-2")}</ul>
        ) : (
          <ul>
            <li>
              <button
                type="button"
                onClick={() => (page === WORK_PAGE && frames[0] ? onFrame(frames[0]) : onPage(WORK_PAGE))}
                aria-current={page === WORK_PAGE ? "page" : undefined}
                className={cn(rowBase, "h-7 pr-2 pl-2", rowTone(page === WORK_PAGE))}
              >
                <span className="w-3.5 shrink-0 text-center text-[12px]">★</span>
                <span className="truncate">{dict.canvas.featured}</span>
              </button>
            </li>
            {groups.map((g) => {
              const items = work.filter((w) => w.group === g.id);
              const open = openGroups.has(g.id);
              return (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(g.id)}
                    aria-expanded={open}
                    className={cn(rowBase, "h-7 pr-2 text-fg hover:bg-fg/8")}
                  >
                    <span className="grid w-5 shrink-0 place-items-center text-faint">
                      <Chevron open={open} />
                    </span>
                    <FrameIcon />
                    <span className="truncate font-medium">{g.title}</span>
                    <span className="ml-auto font-mono text-[10px] text-faint">{pad(items.length)}</span>
                  </button>
                  {open && (
                    <ul>
                      {items.map((w) => {
                        const active = w.id === page;
                        return (
                          <li key={w.id}>
                            <div ref={active ? currentRow : undefined} className={cn(rowBase, "group/row pr-1 pl-7", rowTone(active))}>
                              <button
                                type="button"
                                onClick={() => (active && frames[0] ? onFrame(frames[0]) : onPage(w.id))}
                                aria-current={active ? "page" : undefined}
                                className="flex h-8 min-w-0 flex-1 items-center gap-2 text-left"
                              >
                                <Thumb cover={w.cover} />
                                <span className="truncate">{w.title}</span>
                              </button>
                              <Link
                                href={localePath(locale, `/work/${w.slug}`)}
                                aria-label={`${dict.canvas.open}: ${w.title}`}
                                title={dict.canvas.openFull}
                                className="grid size-6 shrink-0 place-items-center rounded opacity-0 transition-opacity group-hover/row:opacity-100 hover:bg-fg/10 focus-visible:opacity-100"
                              >
                                ↗
                              </Link>
                            </div>
                            {/* The open project's artboards */}
                            {active && <ul>{frameRows("pl-14")}</ul>}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {footer && <div className="border-t border-line p-2">{footer}</div>}
    </aside>
  );
}
