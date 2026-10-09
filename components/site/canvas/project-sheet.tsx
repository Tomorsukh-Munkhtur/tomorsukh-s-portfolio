"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { localePath, t } from "@/lib/i18n";
import type { Category, Project } from "@/lib/types";
import { cn, pad, paragraphs } from "@/lib/utils";
import { Img } from "../img";
import { useLocale } from "../locale-provider";
import { trackView } from "../view-tracker";

const EASE = [0.16, 1, 0.3, 1] as const;

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {children}
    </button>
  );
}

/**
 * Project details in a wide sheet beside the canvas, so visitors never leave
 * the file. Prev/next walk through the work in layer order.
 */
export function ProjectSheet({
  project,
  category,
  index,
  total,
  next,
  onPrev,
  onNext,
  onClose,
}: {
  project: Project;
  category?: Category;
  index: number;
  total: number;
  next: Project | null;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}) {
  const { locale, dict } = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const title = t(project, "title", locale);
  const summary = t(project, "summary", locale);
  const body = paragraphs(t(project, "description", locale));

  const meta = [
    { label: dict.project.client, value: project.client },
    { label: dict.project.year, value: project.year ? String(project.year) : "" },
    { label: dict.project.role, value: t(project, "role", locale) },
    { label: dict.project.tools, value: project.tools.join(", ") },
  ].filter((m) => m.value);

  // Focus the content so the keyboard scrolls it straight away.
  useEffect(() => {
    scrollRef.current?.focus({ preventScroll: true });
  }, []);

  // New project: back to the top, and count it as a view of that project.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    trackView(`/${locale}/work/${project.slug}`);
  }, [locale, project.slug]);

  return (
    <motion.aside
      role="dialog"
      aria-label={title}
      initial={{ x: "105%" }}
      animate={{ x: 0 }}
      exit={{ x: "105%" }}
      transition={{ duration: 0.45, ease: EASE }}
      className="fixed inset-0 z-40 flex flex-col bg-elev lg:inset-y-3 lg:right-3 lg:left-auto lg:w-[min(56vw,860px)] lg:rounded-2xl lg:border lg:border-line lg:shadow-2xl"
    >
      <header className="flex items-center gap-2 border-b border-line px-4 py-3">
        <IconButton label={dict.canvas.prevProject} onClick={onPrev}>
          ←
        </IconButton>
        <IconButton label={dict.canvas.nextProject} onClick={onNext}>
          →
        </IconButton>
        <span className="ml-1 font-mono text-xs text-muted tabular-nums">
          {pad(index + 1)} / {pad(total)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href={localePath(locale, `/work/${project.slug}`)}
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-sm text-muted transition-colors hover:border-line-strong hover:text-fg sm:inline-flex"
          >
            {dict.canvas.openFull} ↗
          </Link>
          <IconButton label={dict.nav.close} onClick={onClose}>
            ✕
          </IconButton>
        </div>
      </header>

      <div ref={scrollRef} tabIndex={-1} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="px-5 pt-8 pb-12 md:px-10 md:pt-10"
          >
            <p className="eyebrow">
              {[category && t(category, "name", locale), project.year].filter(Boolean).join(" · ")}
            </p>
            <h2 className="mt-3 text-4xl leading-[0.95] font-semibold tracking-[-0.045em] md:text-6xl">{title}</h2>
            {summary && <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{summary}</p>}

            {project.cover && (
              <div className="mt-8 overflow-hidden rounded-xl bg-soft">
                <Img
                  src={project.cover.url}
                  alt={title}
                  width={project.cover.width ?? 1600}
                  height={project.cover.height ?? 1200}
                  sizes="(min-width: 1024px) 860px, 100vw"
                  loading="eager"
                  className="h-auto w-full"
                />
              </div>
            )}

            {meta.length > 0 && (
              <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-6 md:grid-cols-4">
                {meta.map((m) => (
                  <div key={m.label}>
                    <dt className="eyebrow">{m.label}</dt>
                    <dd className="mt-1.5 text-sm leading-snug">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {project.external_url && (
              <a
                href={project.external_url}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg"
              >
                {dict.project.visit} ↗
              </a>
            )}

            {body.length > 0 && (
              <section className="mt-12">
                <p className="eyebrow mb-4">{dict.project.overview}</p>
                <div className="space-y-4">
                  {body.map((p, i) => (
                    <p
                      key={i}
                      className={cn(
                        i === 0 ? "text-xl leading-snug font-medium tracking-[-0.015em] md:text-2xl" : "leading-relaxed text-muted",
                      )}
                    >
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {project.gallery.length > 0 && (
              <section className="mt-12" aria-label={dict.project.gallery}>
                <p className="eyebrow mb-4">{dict.project.gallery}</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {project.gallery.map((image, i) => (
                    <li key={`${image.url}-${i}`} className={cn("overflow-hidden rounded-xl bg-soft", image.wide && "sm:col-span-2")}>
                      <Img
                        src={image.url}
                        alt={`${title} — ${i + 1}`}
                        width={image.width ?? 1600}
                        height={image.height ?? 1200}
                        sizes={image.wide ? "(min-width: 1024px) 860px, 100vw" : "(min-width: 1024px) 430px, 100vw"}
                        className="h-auto w-full"
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {next && next.id !== project.id && (
              <button
                type="button"
                onClick={onNext}
                className="group mt-12 flex w-full items-center justify-between gap-4 rounded-xl border border-line p-4 text-left transition-colors hover:border-line-strong"
              >
                <span>
                  <span className="eyebrow block">{dict.project.next}</span>
                  <span className="mt-1 block text-xl font-semibold tracking-tight">{t(next, "title", locale)}</span>
                </span>
                <span className="text-xl transition-transform duration-500 ease-out-expo group-hover:translate-x-1">→</span>
              </button>
            )}
          </motion.article>
        </AnimatePresence>
      </div>
    </motion.aside>
  );
}
