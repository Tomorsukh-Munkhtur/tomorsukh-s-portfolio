"use client";

import { motion } from "motion/react";
import { COVER_SEEN } from "@/lib/cover";
import { t } from "@/lib/i18n";
import { SITE_THEMES } from "@/lib/theme";
import type { Project } from "@/lib/types";
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

/**
 * The portfolio's front page, before the Figma-like file: who I am, what I do
 * and a peek at the work. Entering zooms it away into the canvas behind.
 */
export function Cover({
  profile,
  featured,
  onEnter,
  onContact,
  onProject,
}: {
  profile: Profile;
  featured: Project[];
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
      className="fixed inset-0 z-[55] overflow-y-auto bg-bg"
      exit={{ opacity: 0, scale: 0.94, filter: "blur(6px)" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
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
    </motion.section>
  );
}
