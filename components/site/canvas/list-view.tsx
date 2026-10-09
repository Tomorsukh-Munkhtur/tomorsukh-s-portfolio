"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { localePath, t } from "@/lib/i18n";
import type { Category, Project } from "@/lib/types";
import { cn, pad } from "@/lib/utils";
import { Img } from "../img";
import { useLocale } from "../locale-provider";

/** Quick-scan index of every project, for visitors who'd rather not explore the canvas. */
export function ListView({
  projects,
  categories,
  inset,
  onOpen,
}: {
  projects: Project[];
  categories: Category[];
  /** Leave room for the docked layers panel on desktop. */
  inset?: boolean;
  /** Open a project in the side sheet instead of leaving the page. */
  onOpen?: (slug: string) => void;
}) {
  const { locale, dict } = useLocale();
  const [hovered, setHovered] = useState<Project | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 300, damping: 30 });
  const y = useSpring(my, { stiffness: 300, damping: 30 });
  const byId = new Map(categories.map((c) => [c.id, c]));

  return (
    <div
      className={cn("fixed inset-0 z-20 overflow-y-auto bg-bg pt-24 pb-36 md:pt-28", inset && "lg:pl-[272px]")}
      onPointerMove={(e) => {
        mx.set(e.clientX);
        my.set(e.clientY);
      }}
    >
      <div className="container-x">
        <p className="eyebrow mb-6 md:mb-10">
          ({pad(projects.length)}) {dict.work.title}
        </p>
        <ol className="border-t border-line">
          {projects.map((p, i) => {
            const category = p.category_id ? byId.get(p.category_id) : undefined;
            return (
              <motion.li
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: Math.min(i, 12) * 0.035 }}
              >
                <Link
                  href={localePath(locale, `/work/${p.slug}`)}
                  data-cursor={dict.work.view}
                  onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(p)}
                  onPointerLeave={() => setHovered(null)}
                  onClick={(e) => {
                    if (!onOpen || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                    e.preventDefault();
                    setHovered(null);
                    onOpen(p.slug);
                  }}
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-line py-4 md:grid-cols-[4rem_1fr_12rem_10rem_4rem] md:py-6"
                >
                  <span className="font-mono text-xs text-muted">{pad(i + 1)}</span>
                  <span className="text-2xl leading-tight font-medium tracking-[-0.03em] transition-transform duration-500 ease-out-expo group-hover:translate-x-2 md:text-5xl">
                    {t(p, "title", locale)}
                  </span>
                  <span className="hidden text-sm text-muted md:block">{category ? t(category, "name", locale) : ""}</span>
                  <span className="hidden truncate text-sm text-muted md:block">{p.client}</span>
                  <span className="font-mono text-xs text-muted md:text-right">{p.year}</span>
                  {/* Small thumbnail on touch screens, where there's no hover preview */}
                  {p.cover && (
                    <span className="relative col-span-3 mt-1 block aspect-[16/9] overflow-hidden rounded-xl bg-soft md:hidden">
                      <Img src={p.cover.url} alt="" fill sizes="100vw" className="object-cover" />
                    </span>
                  )}
                </Link>
              </motion.li>
            );
          })}
        </ol>
      </div>

      {/* Floating preview that follows the pointer */}
      <motion.div
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-40 hidden md:block"
        style={{ x, y }}
      >
        <AnimatePresence>
          {hovered?.cover && (
            <motion.div
              key={hovered.id}
              initial={{ opacity: 0, scale: 0.85, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="relative -mt-36 ml-8 h-64 w-80 overflow-hidden rounded-2xl shadow-2xl"
            >
              <Img src={hovered.cover.url} alt="" fill sizes="320px" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
