"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { localePath } from "@/lib/i18n";
import { SITE_THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useLocale } from "./locale-provider";
import { LocaleSwitch } from "./locale-switch";
import { Magnetic } from "./magnetic";
import { MusicPlayer } from "./music/music-player";
import { ThemeToggle } from "./theme-toggle";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Header for pages outside the canvas (project pages, 404). There is no
 * navigation menu: everything lives on the home canvas, so the name leads back
 * there.
 */
export function Header({ name }: { name: string }) {
  const { locale, dict } = useLocale();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 24);
    setHidden(y > 320 && y > prev);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50"
      animate={{ y: hidden ? "-110%" : "0%" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <div
        className={cn(
          "border-b transition-[background-color,border-color,backdrop-filter] duration-500",
          scrolled ? "border-line bg-bg/70 backdrop-blur-xl" : "border-transparent",
        )}
      >
        <div className="container-x flex h-16 items-center justify-between gap-6 md:h-20">
          <Link
            href={localePath(locale)}
            className="group flex items-center gap-2.5 text-[15px] font-semibold tracking-tight"
          >
            <span className="grid size-7 place-items-center rounded-full border border-line text-muted transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">
              ←
            </span>
            <span className="grid size-7 place-items-center rounded-full bg-fg text-[11px] font-bold text-bg">
              {name.trim().charAt(0).toUpperCase() || "•"}
            </span>
            <span>{name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LocaleSwitch />
            </div>
            <MusicPlayer />
            <Magnetic>
              <ThemeToggle label={dict.theme.toggle} themes={SITE_THEMES} />
            </Magnetic>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
