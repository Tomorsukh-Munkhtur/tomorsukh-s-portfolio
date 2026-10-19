"use client";

import { motion } from "motion/react";
import { COVER_SEEN } from "@/lib/cover";
import { t } from "@/lib/i18n";
import { SITE_THEMES } from "@/lib/theme";
import type { ImageAsset, Project } from "@/lib/types";
import { Availability } from "../availability";
import { Img } from "../img";
import { useLocale } from "../locale-provider";
import { LocaleSwitch } from "../locale-switch";
import { ThemeToggle } from "../theme-toggle";
import type { Profile } from "./frames";

const EASE = [0.16, 1, 0.3, 1] as const;

export function shouldSkipCover() {
  try {
    return document.documentElement.dataset.cover === "skip" || Boolean(location.hash) || Boolean(sessionStorage.getItem(COVER_SEEN));
  } catch {
    return false;
  }
}

const WALL_COLUMNS = 7;
/** How tall each column's run is, in column widths: enough to cover a tall phone, tilted. */
const WALL_RUN = 8.5;

/**
 * My work as a tilted wall of covers drifting behind the cover page, each
 * column at its own pace. Dimmed toward the middle so the text stays clear.
 */
function WorkWall({ projects }: { projects: Project[] }) {
  const pics = projects.map((p) => p.cover).filter((c): c is ImageAsset => Boolean(c));
  if (pics.length < 4) return null;
  const ratio = (img: ImageAsset) => (img.width && img.height ? img.height / img.width : 0.75);
  const columns = Array.from({ length: WALL_COLUMNS }, (_, c) => {
    // Each column starts somewhere else in the list, so neighbours differ.
    const run: ImageAsset[] = [];
    for (let i = 0, h = 0; h < WALL_RUN; i++) {
      const img = pics[(c * 5 + i) % pics.length];
      run.push(img);
      h += ratio(img) + 0.1;
    }
    return run;
  });

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 -rotate-12 gap-4 opacity-60">
        {columns.map((run, c) => (
          <div key={c} className="w-[clamp(110px,14vmax,230px)] shrink-0">
            <div
              className={c % 2 ? "animate-wall-down" : "animate-wall-up"}
              style={{ ["--wall-duration" as string]: `${70 + (c % 3) * 18}s` }}
            >
              {/* Twice over: the animation moves by half and starts again unnoticed */}
              {[...run, ...run].map((img, i) => (
                <div key={i} className="pb-4">
                  <div className="relative overflow-hidden rounded-xl bg-soft" style={{ aspectRatio: `1 / ${ratio(img)}` }}>
                    {/* Eager but low priority: drawn at once without getting ahead of my portrait */}
                      <Img src={img.url} alt="" fill sizes="230px" loading="eager" fetchPriority="low" draggable={false} className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Keep the middle calm for the text; let the work show at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_50%,var(--bg)_35%,color-mix(in_oklab,var(--bg)_55%,transparent)_100%)]" />
    </div>
  );
}

/**
 * The portfolio's front page, before the Figma-like file: who I am, what I do
 * and a peek at the work. Entering zooms it away into the canvas behind.
 */
export function Cover({
  profile,
  featured,
  work,
  onEnter,
  onContact,
  onProject,
}: {
  profile: Profile;
  featured: Project[];
  /** Every project, for the wall behind. */
  work: Project[];
  onEnter: () => void;
  onContact: () => void;
  onProject: (slug: string) => void;
}) {
  const { locale, dict } = useLocale();
  const lead = profile.about[0];
  const avatar = profile.avatar;

  return (
    <motion.section
      data-cover-screen=""
      aria-label={profile.name}
      className="fixed inset-0 z-[55] overflow-hidden bg-bg"
      exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <WorkWall projects={work} />
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full flex-col">
          <header className="flex items-center justify-between gap-3 px-5 py-4 md:px-10 md:py-6">
            <span className="text-sm font-semibold tracking-tight">{profile.name}</span>
            <div className="flex items-center gap-2">
              <LocaleSwitch />
              <ThemeToggle label={dict.theme.toggle} themes={SITE_THEMES} />
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-6xl flex-1 content-center items-center gap-10 px-5 pt-2 pb-12 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:gap-16 md:px-10">
            {/* Portrait, whole and at its own shape */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="relative mx-auto w-full max-w-[200px] overflow-hidden rounded-3xl bg-soft md:max-w-[420px]"
              style={{ aspectRatio: avatar ? `${avatar.width ?? 4} / ${avatar.height ?? 5}` : "4 / 5" }}
            >
              {avatar ? (
                // Same sizes as the about frame portrait, so both share one download (and its preload).
                <Img src={avatar.url} alt={profile.name} fill sizes="880px" loading="eager" className="object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center font-serif text-[160px] text-faint italic">
                  {profile.name.charAt(0)}
                </span>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.12, ease: EASE }}
            >
              <Availability available={profile.available} label={profile.available ? dict.hero.available : dict.hero.unavailable} />
              <h1 className="mt-6 text-5xl leading-[0.95] font-semibold tracking-[-0.05em] md:text-7xl">{profile.name}</h1>
              {profile.role && <p className="mt-3 text-lg text-muted md:text-2xl">{profile.role}</p>}
              {lead && <p className="mt-6 max-w-xl text-base leading-relaxed md:text-lg">{lead}</p>}

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onEnter}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-fg transition-transform active:scale-95"
                >
                  {dict.canvas.enter} →
                </button>
                <button
                  type="button"
                  onClick={onContact}
                  className="inline-flex h-12 items-center rounded-full border border-line-strong px-6 font-medium transition-colors hover:bg-fg/5"
                >
                  {dict.hero.talk}
                </button>
              </div>
              <p className="mt-3 text-xs text-muted">{dict.canvas.enterHint}</p>

              {featured.length > 0 && (
                <div className="mt-10">
                  <p className="font-mono text-[11px] tracking-wider text-muted uppercase">{dict.canvas.featured}</p>
                  <ul className="mt-3 flex flex-wrap gap-2.5">
                    {featured.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => onProject(p.slug)}
                          title={t(p, "title", locale)}
                          aria-label={t(p, "title", locale)}
                          className="group relative block h-16 w-24 overflow-hidden rounded-xl bg-soft ring-1 ring-line md:h-20 md:w-28"
                        >
                          {p.cover && (
                            <Img
                              src={p.cover.url}
                              alt=""
                              fill
                              sizes="112px"
                              className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-110"
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
