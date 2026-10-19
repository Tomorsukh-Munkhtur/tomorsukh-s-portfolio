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
import {
  HOME_PAGE,
  pageFromHash,
  pageHash,
  projectPage,
  WORK_PAGE,
  worldBounds,
  type CanvasFile,
  type FrameBox,
  type PageId,
} from "@/lib/canvas-layout";
import { COVER_SEEN } from "@/lib/cover";
import { t } from "@/lib/i18n";
import { SITE_THEMES } from "@/lib/theme";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { LocaleSwitch } from "../locale-switch";
import { MusicPlayer } from "../music/music-player";
import { ThemeToggle } from "../theme-toggle";
import { trackView } from "../view-tracker";
import { MIN_ZOOM, useCamera, type Camera, type Rect } from "./camera";
import { Collaborator, type Stop } from "./collaborator";
import { Cover, shouldSkipCover } from "./cover";
import {
  AboutFrame,
  ArtboardFrame,
  CanvasCard,
  cardLayer,
  ClientsFrame,
  ContactFrame,
  FrameShell,
  frameLayer,
  SkillsFrame,
  type Profile,
} from "./frames";
import { Avatar } from "./avatar";
import { LayersPanel, type WorkEntry } from "./layers-panel";
import { MessageDialog } from "./message-dialog";
import { Minimap } from "./minimap";
import { ProjectPanel } from "./project-panel";
import { Shortcuts } from "./shortcuts";

const TOP = 72;
const PANEL_W = 248;
const DETAILS_W = 320;
const BOTTOM = 96;
const BOTTOM_MOBILE = 64;
/** Room for the project bar along the bottom of phone screens. */
const BOTTOM_MOBILE_PROJECT = 96;
const DESKTOP = 1024;

/* The open page lives in the URL hash ("#work", "#work/<slug>", "#contact") so it can be shared. */
const noSubscribe = () => () => {};
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
/** Each page gets a history entry, so the browser's Back button walks back through them. */
function goToHash(hash: string) {
  if (hash === location.hash) return;
  history.pushState(null, "", hash || location.pathname + location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

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
  file,
  categories,
  profile,
}: {
  file: CanvasFile;
  categories: Category[];
  profile: Profile;
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

  const byPage = useMemo(() => new Map(file.pages.map((p) => [p.id, p])), [file.pages]);
  // Project pages in pages-list order, which prev/next walk through.
  const projectPages = useMemo(() => file.pages.filter((p) => p.project), [file.pages]);
  const hash = useSyncExternalStore(subscribeHash, () => location.hash, () => "");
  const page = pageFromHash(hash, (id) => byPage.has(id));
  const current = byPage.get(page)!;
  const frames = current.frames;
  const project = current.project;
  const projectIndex = project ? projectPages.indexOf(current) : -1;
  const hasDetails = Boolean(project) && !uiHidden;
  const selected = selection?.page === page ? selection.layer : null;

  const gridSize = useGridSize(z);
  const gridPos = useGridPosition(x, y);
  const bounds = useMemo(() => worldBounds(frames), [frames]);
  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Visible canvas area: below the toolbar, between the layers panel and the
  // project details, above the bottom controls.
  const viewRect = useCallback((): Rect => {
    const desktop = vw.get() >= DESKTOP;
    const left = desktop && !uiHidden ? 12 + PANEL_W + 28 : 16;
    const right = desktop && hasDetails ? 12 + DETAILS_W + 28 : 16;
    const bottom = desktop ? BOTTOM : hasDetails ? BOTTOM_MOBILE_PROJECT : BOTTOM_MOBILE;
    return { x: left, y: TOP, w: Math.max(120, vw.get() - left - right), h: vh.get() - TOP - bottom };
  }, [hasDetails, uiHidden, vw, vh]);

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
  const goTo = useCallback((id: PageId) => {
    goToHash(pageHash(id));
    setDrawer(false);
  }, []);
  const openProject = useCallback((slug: string) => goTo(projectPage(slug)), [goTo]);

  // The cover greets each visit once, then zooms away into the canvas. The
  // server always renders it; a script hides it before paint for those who skip.
  // Clicking my profile in the panel brings it back.
  const skipCover = useSyncExternalStore(noSubscribe, shouldSkipCover, () => false);
  const [cover, setCover] = useState<"auto" | "open" | "closed">("auto");
  const showCover = cover === "open" || (cover === "auto" && !skipCover);
  const enter = useCallback(() => {
    try {
      sessionStorage.setItem(COVER_SEEN, "1");
    } catch {}
    setCover("closed");
  }, []);
  const openCover = useCallback(() => {
    delete document.documentElement.dataset.cover; // the pre-paint "skip" would hide it
    setDrawer(false);
    setCover("open");
  }, []);
  const featured = useMemo(() => byPage.get(WORK_PAGE)?.frames[0]?.cards.slice(0, 4).map((c) => c.project) ?? [], [byPage]);
  const stepProject = useCallback(
    (delta: number) => {
      if (projectIndex < 0) return;
      goTo(projectPages[(projectIndex + delta + projectPages.length) % projectPages.length].id);
    },
    [goTo, projectIndex, projectPages],
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
    else if (frames[0]) focusFrame(frames[0], 0);
    const fade = animate(reveal, 1, { duration: 0.45 });
    return () => {
      fade.stop();
      store.set(page, { x: x.get(), y: y.get(), z: z.get() });
    };
    // Only when the page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // A project page counts as a view of that project in the stats.
  useEffect(() => {
    if (project) trackView(`/${locale}/work/${project.slug}`);
  }, [locale, project]);

  useMotionValueEvent(z, "change", (v) => worldRef.current?.style.setProperty("--z", String(v)));

  // Wheel: pan, or zoom around the pointer with Ctrl/⌘ (also trackpad pinch).
  useEffect(() => {
    const root = rootRef.current!;
    const onWheel = (e: WheelEvent) => {
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
  }, [camera, x, y]);

  // Keyboard shortcuts, Figma-style.
  useEffect(() => {
    if (dialog || showCover) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.altKey) return;
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
      } else if (project && (e.key === "PageDown" || e.key === "PageUp")) {
        e.preventDefault();
        stepProject(e.key === "PageDown" ? 1 : -1);
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
  }, [camera, dialog, fitAll, frames, project, selectFrame, showCover, stepProject, x, y, z, zoomCenter]);

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
          {f.kind === "cards" &&
            f.cards.map((c, ci) => (
              <CanvasCard
                key={c.project.id}
                card={c}
                eager={ci < 4}
                selected={selected === cardLayer(c.project.id)}
                onOpen={openProject}
                category={c.project.category_id ? byId.get(c.project.category_id) : undefined}
              />
            ))}
          {f.kind === "artboard" && (
            <ArtboardFrame frame={f} title={project ? t(project, "title", locale) : f.title} eager={i < 2} />
          )}
          {f.kind === "about" && <AboutFrame profile={profile} onSeeWork={() => goTo(WORK_PAGE)} />}
          {f.kind === "skills" && <SkillsFrame profile={profile} />}
          {f.kind === "clients" && <ClientsFrame profile={profile} />}
          {f.kind === "contact" && <ContactFrame profile={profile} onMessage={() => setDialog(true)} />}
        </FrameShell>
      )),
    [byId, frames, goTo, locale, openProject, profile, project, selected],
  );

  // The collaborator tours whatever is on the current page.
  const stops = useMemo<Stop[]>(() => {
    const first = frames[0];
    if (!first) return [];
    if (page === HOME_PAGE) {
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
    if (project) {
      // Left part of the cover, clear of the details panel.
      return [{ x: first.x + Math.min(first.w * 0.4, 900), y: first.y + 90, message: dict.canvas.thanks }];
    }
    const cards = frames.flatMap((f) => f.cards.map((c) => ({ f, c }))).slice(0, 5);
    return [
      { x: first.x + first.w - 230, y: first.y + 70, message: dict.canvas.greet },
      ...cards.map(({ f, c }) => ({
        x: f.x + c.x + c.w * 0.72,
        y: f.y + c.y + c.imgH * 0.38,
        message: `${dict.canvas.look}: ${t(c.project, "title", locale)}`,
      })),
    ];
  }, [dict, frames, locale, page, project]);

  // The work tree in the layers panel: every project page with its cover.
  const workEntries = useMemo<WorkEntry[]>(
    () =>
      projectPages.map((p) => ({
        id: p.id,
        group: p.group,
        slug: p.project!.slug,
        title: t(p.project!, "title", locale),
        cover: p.project!.cover,
      })),
    [locale, projectPages],
  );

  const panelVisible = !uiHidden;
  const panel = (mobile: boolean) => (
    <LayersPanel
      key={page}
      name={profile.name}
      role={profile.role}
      avatar={profile.avatar}
      onProfile={openCover}
      work={workEntries}
      groups={file.groups}
      page={page}
      frames={frames}
      selected={selected}
      onPage={goTo}
      onFrame={selectFrame}
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
          // What the phone toolbar has no room for.
          <div className="flex items-center justify-between gap-3">
            <LocaleSwitch />
            <ThemeToggle label={dict.theme.toggle} themes={SITE_THEMES} />
          </div>
        ) : undefined
      }
      className={mobile ? "rounded-none rounded-r-2xl border-y-0 border-l-0" : undefined}
    />
  );

  return (
    <>
      <div
        ref={rootRef}
        data-canvas=""
        className="fixed inset-0 touch-none overflow-hidden bg-bg select-none"
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
          {/* On phones the speech bubble would cover the work, so the tour is a desktop treat. */}
          <div className="hidden md:block">
            {!showCover && <Collaborator key={page} name={profile.name} stops={stops} zoom={z} />}
          </div>
        </motion.div>
      </div>

      {/* The file's panels and tools, once the cover has gone */}
      {!showCover && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.2 }}>
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
                  className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setDrawer(false)}
                />
                <motion.div
                  className="fixed inset-y-0 left-0 z-50 w-[min(320px,calc(100vw-56px))] lg:hidden"
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  {panel(true)}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Top bar: the layers button (phones and tablets) and the toolbar, where Figma keeps collaborators and Share */}
          <div className="pointer-events-none fixed inset-x-3 top-3 z-30 flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label={dict.canvas.layers}
              className="pointer-events-auto flex h-12 shrink-0 items-center gap-2.5 rounded-2xl border border-line bg-elev pr-3.5 pl-2 shadow-lg lg:hidden"
            >
              <Avatar name={profile.name} image={profile.avatar} />
              {/* The name is on the about frame anyway; phones need the room. */}
              <span className="hidden max-w-[30vw] truncate text-sm font-semibold sm:block">{profile.name}</span>
              <svg viewBox="0 0 16 16" className="size-4 text-muted" aria-hidden>
                <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>

            <div className="pointer-events-auto ml-auto flex h-12 items-center gap-1.5 rounded-2xl border border-line bg-elev px-1.5 shadow-lg">
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
          </div>

          {/* Bottom right: minimap and zoom. Phones pinch to zoom, so they only get "fit". */}
          <div
            className={cn(
              "pointer-events-none fixed z-30",
              hasDetails
                ? "right-3 bottom-[84px] md:right-5 md:bottom-[88px] lg:right-[352px] lg:bottom-5"
                : "right-3 bottom-3 md:right-5 md:bottom-5",
              uiHidden && "invisible",
            )}
          >
            <div className="relative flex flex-col items-end gap-2">
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
                <button type="button" onClick={() => zoomCenter(1 / 1.5)} aria-label={dict.canvas.zoomOut} className="hidden size-8 place-items-center rounded-full hover:bg-soft md:grid">
                  −
                </button>
                <div className="hidden md:block">
                  <ZoomLabel zoom={z} />
                </div>
                <button type="button" onClick={() => zoomCenter(1.5)} aria-label={dict.canvas.zoomIn} className="hidden size-8 place-items-center rounded-full hover:bg-soft md:grid">
                  +
                </button>
                <button type="button" onClick={fitAll} title={dict.canvas.fit} aria-label={dict.canvas.fit} className="grid size-9 place-items-center rounded-full hover:bg-soft md:size-8">
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

          {project && hasDetails && (
            <ProjectPanel
              project={project}
              category={project.category_id ? byId.get(project.category_id) : undefined}
              index={projectIndex}
              total={projectPages.length}
              onPrev={() => stepProject(-1)}
              onNext={() => stepProject(1)}
            />
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showCover && (
          <Cover
            key="cover"
            profile={profile}
            featured={featured}
            onEnter={enter}
            onContact={() => setDialog(true)}
            onProject={(slug) => {
              enter();
              openProject(slug);
            }}
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
