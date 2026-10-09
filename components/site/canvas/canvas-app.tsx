"use client";

import { AnimatePresence, animate, motion, useMotionValue, useMotionValueEvent } from "motion/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { worldBounds, type CardBox, type FrameBox, type PageId } from "@/lib/canvas-layout";
import { t } from "@/lib/i18n";
import { SITE_THEMES } from "@/lib/theme";
import type { CanvasBackgrounds, Category, Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { LocaleSwitch } from "../locale-switch";
import { MusicPlayer } from "../music/music-player";
import { ThemeToggle } from "../theme-toggle";
import { canvasStyle, effectiveBackground, useCanvasPrefs } from "./background";
import { MIN_ZOOM, useCamera, type Camera, type Rect } from "./camera";
import { Collaborator, type Stop } from "./collaborator";
import {
  AboutFrame,
  CanvasCard,
  cardLayer,
  ClientsFrame,
  ContactFrame,
  FrameShell,
  frameLayer,
  IntroFrame,
  SkillsFrame,
  type Profile,
} from "./frames";
import { LayersPanel } from "./layers-panel";
import { ListView } from "./list-view";
import { MessageDialog } from "./message-dialog";
import { Minimap } from "./minimap";
import { PagePanel } from "./page-panel";
import { ProjectSheet } from "./project-sheet";
import { Shortcuts } from "./shortcuts";

const TOP = 72;
const PANEL_W = 248;
const PAGE_PANEL_W = 240;
const BOTTOM = 96;
const BOTTOM_MOBILE = 84;
const DESKTOP = 1024;

/* Page, view and open project live in the URL hash ("#about", "#list", "#work/<slug>") so they can be shared. */
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
function setHash(hash: string) {
  history.replaceState(null, "", hash || location.pathname + location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
const pageHash = (page: PageId) => (page === "work" ? "" : `#${page}`);

function ZoomLabel({ zoom }: { zoom: Camera["z"] }) {
  const [pct, setPct] = useState(100);
  useMotionValueEvent(zoom, "change", (v) => setPct(Math.round(v * 100)));
  return <span className="w-12 text-center font-mono text-xs tabular-nums">{pct}%</span>;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

const COLLAB = "#d4ff3f";
const YOU = "#ff6b2c";

export function CanvasApp({
  pages,
  projects,
  categories,
  profile,
  canvasBg,
}: {
  pages: Record<PageId, FrameBox[]>;
  projects: Project[];
  categories: Category[];
  profile: Profile;
  /** Owner's per-page background from the admin; visitors may override. */
  canvasBg: CanvasBackgrounds;
}) {
  const { locale, dict } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const camera = useCamera();
  const { x, y, z, vw, vh } = camera;
  const reveal = useMotionValue(0);
  const [help, setHelp] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [selection, setSelection] = useState<{ page: PageId; layer: string } | null>(null);

  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const page: PageId = hash === "#about" ? "about" : hash === "#contact" ? "contact" : "work";
  const view = page === "work" && hash === "#list" ? "list" : "canvas";
  const frames = pages[page];

  // A project open in the side sheet; prev/next follow the layer order.
  const workCards = useMemo(() => pages.work.flatMap((frame) => frame.cards.map((card) => ({ frame, card }))), [pages.work]);
  const sheetSlug = hash.startsWith("#work/") ? decodeURIComponent(hash.slice(6)) : null;
  const sheetIndex = sheetSlug ? workCards.findIndex((w) => w.card.project.slug === sheetSlug) : -1;
  const sheet = sheetIndex >= 0 ? workCards[sheetIndex] : null;
  const sheetOpen = sheet !== null;

  const selected = sheet
    ? cardLayer(sheet.card.project.id)
    : selection?.page === page
      ? selection.layer
      : null;
  const prefs = useCanvasPrefs();
  const background = effectiveBackground(page, prefs.bgs, canvasBg);
  const pagePanelOpen = prefs.panelOpen && !uiHidden;

  const gridSize = useGridSize(z);
  const gridPos = useGridPosition(x, y);
  const bounds = useMemo(() => worldBounds(frames), [frames]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const firstCategory = frames.find((f) => f.kind === "category");

  // Visible canvas area: below the toolbar, between the side panels (or the
  // project sheet), above the bottom bar.
  const viewRect = useCallback((): Rect => {
    const desktop = vw.get() >= DESKTOP;
    const left = desktop && !uiHidden ? 12 + PANEL_W + 28 : 16;
    const right = !desktop
      ? 16
      : sheetOpen
        ? 12 + Math.min(vw.get() * 0.56, 860) + 28
        : pagePanelOpen
          ? 12 + PAGE_PANEL_W + 28
          : 16;
    const bottom = desktop ? BOTTOM : BOTTOM_MOBILE;
    return { x: left, y: TOP, w: Math.max(120, vw.get() - left - right), h: vh.get() - TOP - bottom };
  }, [pagePanelOpen, sheetOpen, uiHidden, vw, vh]);

  const focusRect = useCallback(
    (r: Rect, maxZoom = 1, duration = 0.9) =>
      // On phones frames are much wider than tall, so pin them to the top.
      camera.fit(r, viewRect(), maxZoom, duration, vw.get() < 768),
    [camera, viewRect, vw],
  );
  const focusFrame = useCallback(
    (f: FrameBox, duration = 0.9) => focusRect({ x: f.x - 40, y: f.y - 60, w: f.w + 80, h: f.h + 100 }, 1, duration),
    [focusRect],
  );
  const fitAll = useCallback(
    () => camera.fit({ x: bounds.x - 80, y: bounds.y - 80, w: bounds.w + 160, h: bounds.h + 160 }, viewRect(), 1),
    [bounds, camera, viewRect],
  );
  const zoomCenter = useCallback(
    (factor: number) => {
      const r = viewRect();
      const target = Math.max(MIN_ZOOM, z.get() * factor);
      const k = target / z.get();
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      camera.flyTo(cx - (cx - x.get()) * k, cy - (cy - y.get()) * k, target, 0.35);
    },
    [camera, viewRect, x, y, z],
  );

  const selectFrame = useCallback(
    (f: FrameBox) => {
      setSelection({ page, layer: frameLayer(f.id) });
      focusFrame(f);
      setDrawer(false);
    },
    [focusFrame, page],
  );
  // Opening a project pushes a history entry, so Back (handy on phones) closes
  // the sheet; prev/next only replace it.
  const pushedSheet = useRef(false);
  const openProject = useCallback(
    (slug: string) => {
      const w = workCards.find((c) => c.card.project.slug === slug);
      if (!w) return;
      setSelection({ page: "work", layer: cardLayer(w.card.project.id) });
      const target = `#work/${encodeURIComponent(slug)}`;
      if (location.hash.startsWith("#work/")) setHash(target);
      else {
        history.pushState(null, "", target);
        pushedSheet.current = true;
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }
    },
    [workCards],
  );
  const closeSheet = useCallback(() => {
    if (pushedSheet.current) history.back();
    else setHash("");
  }, []);
  const stepSheet = useCallback(
    (delta: number) => {
      if (sheetIndex < 0) return;
      openProject(workCards[(sheetIndex + delta + workCards.length) % workCards.length].card.project.slug);
    },
    [openProject, sheetIndex, workCards],
  );
  const selectCard = useCallback(
    (_f: FrameBox, c: CardBox) => {
      openProject(c.project.slug);
      setDrawer(false);
    },
    [openProject],
  );

  // Hover highlight straight on the DOM, so the canvas never re-renders for it.
  const highlighted = useRef<Element | null>(null);
  const highlight = useCallback((layer: string | null) => {
    highlighted.current?.removeAttribute("data-highlight");
    const el = layer ? worldRef.current?.querySelector(`[data-layer="${layer}"]`) : null;
    el?.setAttribute("data-highlight", "");
    highlighted.current = el ?? null;
  }, []);

  // Track the viewport size.
  useLayoutEffect(() => {
    const root = rootRef.current!;
    const measure = () => {
      vw.set(root.clientWidth);
      vh.set(root.clientHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [vw, vh]);

  // Each page remembers its own camera, like Figma.
  const saved = useRef(new Map<PageId, { x: number; y: number; z: number }>());
  useEffect(() => {
    const store = saved.current;
    const s = store.get(page);
    reveal.set(0);
    if (s) camera.flyTo(s.x, s.y, s.z, 0);
    else focusFrame(pages[page][0], 0);
    const fade = animate(reveal, 1, { duration: 0.45 });
    return () => {
      fade.stop();
      store.set(page, { x: x.get(), y: y.get(), z: z.get() });
    };
    // Only when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Keep the open project in view beside the sheet.
  useEffect(() => {
    if (!sheet) {
      pushedSheet.current = false;
      return;
    }
    const { frame: f, card: c } = sheet;
    focusRect({ x: f.x + c.x - 60, y: f.y + c.y - 60, w: c.w + 120, h: c.imgH + 180 }, 1.2);
    // Only when a different project opens or the sheet closes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetSlug]);

  useMotionValueEvent(z, "change", (v) => worldRef.current?.style.setProperty("--z", String(v)));

  // Wheel: pan, or zoom around the pointer with Ctrl/⌘ (also trackpad pinch).
  useEffect(() => {
    const root = rootRef.current!;
    const onWheel = (e: WheelEvent) => {
      if (view !== "canvas") return;
      e.preventDefault();
      camera.stop();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? root.clientHeight : 1;
      if (e.ctrlKey || e.metaKey) {
        const r = root.getBoundingClientRect();
        camera.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * unit * 0.0075));
      } else {
        const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * unit;
        const dy = (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * unit;
        x.set(x.get() - dx);
        y.set(y.get() - dy);
      }
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [camera, view, x, y]);

  // Keyboard shortcuts, Figma-style.
  useEffect(() => {
    if (view !== "canvas" || dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey) return;
      // With a project open, ←/→ browse the work and Esc closes it.
      if (sheetOpen) {
        if (e.key === "Escape") closeSheet();
        else if (e.key === "ArrowRight") stepSheet(1);
        else if (e.key === "ArrowLeft") stepSheet(-1);
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "\\") {
        e.preventDefault();
        setUiHidden((h) => !h);
      } else if (e.key === "?") setHelp((h) => !h);
      else if (e.key === "Escape") {
        setHelp(false);
        setSelection(null);
      } else if (e.code === "Digit0" && e.shiftKey) {
        e.preventDefault();
        zoomCenter(1 / z.get());
      } else if (e.key === "0" || (e.code === "Digit1" && e.shiftKey)) {
        e.preventDefault();
        fitAll();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomCenter(1.5);
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomCenter(1 / 1.5);
      } else if (!mod && /^[1-9]$/.test(e.key) && frames[Number(e.key) - 1]) {
        selectFrame(frames[Number(e.key) - 1]);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 480 : 160;
        const dx = e.key === "ArrowLeft" ? step : e.key === "ArrowRight" ? -step : 0;
        const dy = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
        camera.flyTo(x.get() + dx, y.get() + dy, z.get(), 0.35);
      } else if (e.key === " ") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [camera, closeSheet, dialog, fitAll, frames, selectFrame, sheetOpen, stepSheet, view, x, y, z, zoomCenter]);

  // Drag to pan (with inertia), two fingers to pinch-zoom; a click without movement still works.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ sx: number; sy: number; cx: number; cy: number; moved: boolean; vx: number; vy: number; t: number } | null>(null);
  const pinch = useRef<{ dist: number; mx: number; my: number } | null>(null);
  const suppressClick = useRef(false);

  const local = (e: PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;
    camera.stop();
    const p = local(e);
    pointers.current.set(e.pointerId, p);
    suppressClick.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
      drag.current = null;
    } else {
      drag.current = { sx: p.x, sy: p.y, cx: x.get(), cy: y.get(), moved: false, vx: 0, vy: 0, t: performance.now() };
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = local(e);
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, p);

    if (pinch.current && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      x.set(x.get() + mx - pinch.current.mx);
      y.set(y.get() + my - pinch.current.my);
      camera.zoomAt(mx, my, dist / pinch.current.dist);
      pinch.current = { dist, mx, my };
      return;
    }

    const d = drag.current;
    if (!d) return;
    if (!d.moved && Math.hypot(p.x - d.sx, p.y - d.sy) > 4) {
      d.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      document.documentElement.dataset.grabbing = "1";
    }
    if (!d.moved) return;
    x.set(d.cx + p.x - d.sx);
    y.set(d.cy + p.y - d.sy);
    const now = performance.now();
    const dt = Math.max(1, now - d.t);
    d.vx = d.vx * 0.6 + ((p.x - prev.x) / dt) * 0.4;
    d.vy = d.vy * 0.6 + ((p.y - prev.y) / dt) * 0.4;
    d.t = now;
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    const d = drag.current;
    if (d?.moved) {
      suppressClick.current = true;
      if (performance.now() - d.t < 80) camera.glide(d.vx, d.vy);
    } else if (d && !(e.target as Element).closest("a, button")) {
      setSelection(null); // click on empty canvas clears the selection
    }
    drag.current = null;
    delete document.documentElement.dataset.grabbing;
  };

  // Frames and cards depend only on content and selection. Memoised so that UI
  // state (page background, panels, help…) never re-renders the whole canvas.
  const world = useMemo(
    () =>
      frames.map((f, i) => (
        <FrameShell key={f.id} frame={f} index={i} selected={selected === frameLayer(f.id)}>
          {f.kind === "intro" && (
            <IntroFrame
              profile={profile}
              onSeeWork={() => firstCategory && selectFrame(firstCategory)}
              onContact={() => setDialog(true)}
            />
          )}
          {f.kind === "category" &&
            f.cards.map((c, ci) => (
              <CanvasCard
                key={c.project.id}
                card={c}
                eager={ci === 0 || (f === firstCategory && ci < 4)}
                selected={selected === cardLayer(c.project.id)}
                onOpen={openProject}
                category={c.project.category_id ? byId.get(c.project.category_id) : undefined}
              />
            ))}
          {f.kind === "about" && <AboutFrame profile={profile} />}
          {f.kind === "skills" && <SkillsFrame profile={profile} />}
          {f.kind === "clients" && <ClientsFrame profile={profile} />}
          {f.kind === "contact" && <ContactFrame profile={profile} onMessage={() => setDialog(true)} />}
        </FrameShell>
      )),
    [byId, firstCategory, frames, openProject, profile, selectFrame, selected],
  );

  // The collaborator tours whatever is on the current page.
  const stops = useMemo<Stop[]>(() => {
    const first = frames[0];
    if (page === "about") {
      // "That's me" points at the portrait, then the other frames.
      return frames.map((f, i) => ({
        x: f.x + (i === 0 ? 130 : f.w - 220),
        y: f.y + (i === 0 ? 260 : 90),
        message: i === 0 ? dict.canvas.aboutGreet : f.title,
      }));
    }
    if (page === "contact") {
      // Just under the "write a message" button, pointing up at it.
      return [{ x: first.x + first.w - 230, y: first.y + first.h - 46, message: dict.canvas.contactGreet }];
    }
    const cards = frames
      .flatMap((f) => f.cards.map((c) => ({ f, c })))
      .sort((a, b) => Number(b.c.project.featured) - Number(a.c.project.featured))
      .slice(0, 5);
    return [
      { x: first.x + first.w - 230, y: first.y + 70, message: dict.canvas.greet },
      ...cards.map(({ f, c }) => ({
        x: f.x + c.x + c.w * 0.72,
        y: f.y + c.y + c.imgH * 0.38,
        message: `${dict.canvas.look}: ${t(c.project, "title", locale)}`,
      })),
    ];
  }, [dict, frames, locale, page]);

  const panelVisible = !uiHidden;
  const panel = (mobile: boolean) => (
    <LayersPanel
      key={page}
      name={profile.name}
      role={profile.role}
      page={page}
      frames={frames}
      selected={selected}
      onPage={(p) => {
        setHash(pageHash(p));
        if (mobile) setDrawer(false);
      }}
      onFrame={selectFrame}
      onCard={selectCard}
      onHover={highlight}
      header={
        mobile ? (
          <button
            type="button"
            onClick={() => setDrawer(false)}
            aria-label={dict.nav.close}
            className="grid size-8 place-items-center rounded-lg text-muted hover:text-fg"
          >
            ✕
          </button>
        ) : undefined
      }
      footer={
        mobile ? (
          <div className="space-y-3">
            <PagePanel page={page} current={background} overridden={prefs.bgs[page] !== undefined} open compact />
            <LocaleSwitch />
          </div>
        ) : undefined
      }
    />
  );

  return (
    <>
      <div
        ref={rootRef}
        data-canvas=""
        style={canvasStyle(background)}
        className={cn(
          "fixed inset-0 touch-none overflow-hidden bg-bg transition-[background-color] duration-500 select-none",
          view === "list" && "pointer-events-none invisible",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {/* Dot grid that moves with the camera */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1.4px)",
            backgroundSize: gridSize,
            backgroundPosition: gridPos,
          }}
        />

        <motion.div
          ref={worldRef}
          className="absolute top-0 left-0 origin-top-left"
          style={{ x, y, scale: z, opacity: reveal }}
        >
          {world}
          <Collaborator key={page} name={profile.name} stops={stops} zoom={z} />
        </motion.div>
      </div>

      <AnimatePresence>
        {view === "list" && (
          <ListView projects={projects} categories={categories} inset={panelVisible} onOpen={openProject} />
        )}
      </AnimatePresence>

      {/* Layers & pages: docked on desktop, a drawer on smaller screens */}
      <AnimatePresence>
        {panelVisible && (
          <motion.div
            className="fixed top-3 bottom-3 left-3 z-40 hidden lg:block"
            style={{ width: PANEL_W }}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {panel(false)}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawer(false)}
            />
            <motion.div
              className="fixed top-3 bottom-3 left-3 z-50 w-[min(300px,calc(100vw-24px))] lg:hidden"
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {panel(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Figma's right panel with nothing selected: the page background */}
      {!uiHidden && (
        <div className="fixed top-[68px] right-3 z-30 hidden lg:block">
          <PagePanel page={page} current={background} overridden={prefs.bgs[page] !== undefined} open={prefs.panelOpen} />
        </div>
      )}

      {/* Mobile: open the layers drawer */}
      <button
        type="button"
        onClick={() => setDrawer(true)}
        aria-label={dict.canvas.layers}
        className="fixed top-3 left-3 z-30 flex h-12 items-center gap-2.5 rounded-2xl border border-line bg-elev pr-4 pl-2 shadow-lg lg:hidden"
      >
        <span className="grid size-8 place-items-center rounded-lg bg-fg text-sm font-semibold text-bg">
          {profile.name.charAt(0)}
        </span>
        <span className="max-w-[34vw] truncate text-sm font-semibold">{profile.name}</span>
        <svg viewBox="0 0 16 16" className="size-4 text-muted" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Top-right toolbar, where Figma keeps collaborators and Share */}
      <div className="fixed top-3 right-3 z-30 flex h-12 items-center gap-1.5 rounded-2xl border border-line bg-elev px-1.5 shadow-lg">
        <div className="hidden items-center -space-x-1.5 px-1 md:flex">
          <span
            title={`${profile.name} · ${dict.canvas.owner}`}
            className="grid size-7 place-items-center rounded-full text-[11px] font-semibold text-[#111] ring-2 ring-bg"
            style={{ background: COLLAB }}
          >
            {profile.name.charAt(0)}
          </span>
          <span
            title={dict.canvas.you}
            className="grid size-7 place-items-center rounded-full text-[10px] font-semibold text-white ring-2 ring-bg"
            style={{ background: YOU }}
          >
            {dict.canvas.you}
          </span>
        </div>
        <div className="hidden md:block">
          <LocaleSwitch />
        </div>
        <MusicPlayer />
        <ThemeToggle label={dict.theme.toggle} themes={SITE_THEMES} className="hidden sm:grid" />
        <button
          type="button"
          onClick={() => setDialog(true)}
          className="h-9 rounded-xl bg-accent px-3.5 text-sm font-semibold text-accent-fg transition-transform active:scale-95"
        >
          {dict.hero.talk}
        </button>
      </div>

      {/* Bottom bar: canvas / list toggle and zoom */}
      <div
        className={cn(
          "pointer-events-none fixed right-0 bottom-0 z-30 flex items-end justify-between gap-2 p-3 md:p-5",
          panelVisible ? "left-0 lg:left-[272px]" : "left-0",
        )}
      >
        <div className="pointer-events-auto md:absolute md:bottom-5 md:left-1/2 md:-translate-x-1/2">
          {page === "work" && (
            <div className="flex rounded-full border border-line bg-elev p-1 text-sm shadow-lg">
              {(["canvas", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setHash(v === "list" ? "#list" : "")}
                  aria-pressed={view === v}
                  className={cn(
                    "relative isolate rounded-full px-4 py-2 transition-colors",
                    view === v ? "text-accent-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {view === v && <motion.span layoutId="view-pill" className="absolute inset-0 -z-10 rounded-full bg-accent" />}
                  {v === "canvas" ? dict.canvas.canvas : dict.canvas.list}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={cn("relative ml-auto flex flex-col items-end gap-2", (view === "list" || uiHidden) && "invisible")}>
          <AnimatePresence>
            {help && (
              <div className="pointer-events-auto absolute right-0 bottom-full mb-2">
                <Shortcuts onClose={() => setHelp(false)} />
              </div>
            )}
          </AnimatePresence>
          <div
            className={cn(
              "pointer-events-auto hidden rounded-2xl border border-line bg-elev p-2 shadow-lg",
              frames.length > 1 && "md:block", // a map of a single frame says nothing
            )}
          >
            <Minimap frames={frames} bounds={bounds} camera={camera} label={dict.canvas.map} />
          </div>
          <div className="pointer-events-auto flex items-center rounded-full border border-line bg-elev p-1 shadow-lg">
            <button type="button" onClick={() => zoomCenter(1 / 1.5)} aria-label={dict.canvas.zoomOut} className="grid size-8 place-items-center rounded-full hover:bg-soft">
              −
            </button>
            <ZoomLabel zoom={z} />
            <button type="button" onClick={() => zoomCenter(1.5)} aria-label={dict.canvas.zoomIn} className="grid size-8 place-items-center rounded-full hover:bg-soft">
              +
            </button>
            <button type="button" onClick={fitAll} title={dict.canvas.fit} aria-label={dict.canvas.fit} className="grid size-8 place-items-center rounded-full hover:bg-soft">
              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                <path d="M1.5 5.5v-4h4M10.5 1.5h4v4M14.5 10.5v4h-4M5.5 14.5h-4v-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setHelp((h) => !h)}
              aria-label={dict.canvas.shortcuts}
              aria-expanded={help}
              className="hidden size-8 place-items-center rounded-full font-mono text-xs hover:bg-soft md:grid"
            >
              ?
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {sheet && (
          <ProjectSheet
            key="sheet"
            project={sheet.card.project}
            category={sheet.card.project.category_id ? byId.get(sheet.card.project.category_id) : undefined}
            index={sheetIndex}
            total={workCards.length}
            next={workCards[(sheetIndex + 1) % workCards.length].card.project}
            onPrev={() => stepSheet(-1)}
            onNext={() => stepSheet(1)}
            onClose={closeSheet}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>{dialog && <MessageDialog onClose={() => setDialog(false)} />}</AnimatePresence>
    </>
  );
}

/* Dot grid follows pan and zoom so the canvas feels physical. */
function useGridSize(z: Camera["z"]) {
  const size = useMotionValue("32px 32px");
  useMotionValueEvent(z, "change", (v) => {
    const s = 32 * v * 2 ** -Math.floor(Math.log2(v));
    size.set(`${s}px ${s}px`);
  });
  return size;
}

function useGridPosition(x: Camera["x"], y: Camera["y"]) {
  const pos = useMotionValue("0px 0px");
  const update = () => pos.set(`${x.get()}px ${y.get()}px`);
  useMotionValueEvent(x, "change", update);
  useMotionValueEvent(y, "change", update);
  return pos;
}
