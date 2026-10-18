"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { localePath, t } from "@/lib/i18n";
import type { Category, Project } from "@/lib/types";
import { cn, pad, paragraphs } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { RichText } from "../rich-text";

const EASE = [0.16, 1, 0.3, 1] as const;

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-fg/8 hover:text-fg"
    >
      {children}
    </button>
  );
}

type Props = {
  project: Project;
  category?: Category;
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

function Stepper({ index, total, onPrev, onNext }: Pick<Props, "index" | "total" | "onPrev" | "onNext">) {
  const { dict } = useLocale();
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label={dict.canvas.prevProject} onClick={onPrev}>
        ←
      </IconButton>
      <span className="px-1 font-mono text-[11px] text-muted tabular-nums">
        {pad(index + 1)} / {pad(total)}
      </span>
      <IconButton label={dict.canvas.nextProject} onClick={onNext}>
        →
      </IconButton>
    </div>
  );
}

/** Everything written about the project: the body of both the desktop panel and the phone sheet. */
function Details({ project, category }: Pick<Props, "project" | "category">) {
  const { locale, dict } = useLocale();
  const title = t(project, "title", locale);
  const summary = t(project, "summary", locale);
  const body = paragraphs(t(project, "description", locale));
  const meta = [
    { label: dict.project.client, value: project.client },
    { label: dict.project.year, value: project.year ? String(project.year) : "" },
    { label: dict.project.role, value: t(project, "role", locale) },
    { label: dict.project.tools, value: project.tools.join(", ") },
  ].filter((m) => m.value);

  return (
    <div className="space-y-6 p-4">
      <div>
        <p className="font-mono text-[11px] tracking-wider text-muted uppercase">
          {[category && t(category, "name", locale), project.year].filter(Boolean).join(" · ")}
        </p>
        <h2 className="mt-2 text-2xl leading-tight font-semibold tracking-[-0.03em]">{title}</h2>
        {summary && <p className="mt-2 text-sm leading-relaxed text-muted">{summary}</p>}
      </div>

      {meta.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line pt-4">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="text-[11px] text-muted">{m.label}</dt>
              <dd className="mt-0.5 text-[13px] leading-snug">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {project.external_url && (
        <a
          href={project.external_url}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-accent-fg"
        >
          {dict.project.visit} ↗
        </a>
      )}

      {body.length > 0 && (
        <div className="space-y-3 border-t border-line pt-4">
          <p className="text-[11px] text-muted">{dict.project.overview}</p>
          {body.map((p, i) => (
            <p key={i} className={cn("leading-relaxed", i === 0 ? "text-[15px] font-medium" : "text-[13px] text-muted")}>
              <RichText text={p} />
            </p>
          ))}
        </div>
      )}

      <Link
        href={localePath(locale, `/work/${project.slug}`)}
        className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line text-[13px] text-muted transition-colors hover:border-line-strong hover:text-fg"
      >
        {dict.canvas.openFull} ↗
      </Link>
    </div>
  );
}

/**
 * The project's write-up, like Figma's properties panel: docked on the right on
 * desktop, a sheet that pulls up from the bottom on smaller screens.
 */
export function ProjectPanel(props: Props) {
  const { project } = props;
  const { locale, dict } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const title = t(project, "title", locale);

  // A new project starts at the top of its write-up.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [project.id]);

  return (
    <>
      {/* Desktop */}
      <aside
        aria-label={dict.canvas.details}
        className="fixed top-[68px] right-3 bottom-3 z-30 hidden w-[320px] flex-col overflow-hidden rounded-2xl border border-line bg-elev text-[13px] shadow-2xl lg:flex"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2">
          <p className="font-semibold">{dict.canvas.details}</p>
          <Stepper {...props} />
        </div>
        <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
            >
              <Details {...props} />
            </motion.div>
          </AnimatePresence>
        </div>
      </aside>

      {/* Phones and tablets: a bar that pulls up into a sheet */}
      <div className="lg:hidden">
        <AnimatePresence>
          {expanded && (
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
            />
          )}
        </AnimatePresence>
        <motion.section
          aria-label={dict.canvas.details}
          layout
          transition={{ duration: 0.35, ease: EASE }}
          className={cn(
            "fixed z-40 flex flex-col overflow-hidden border border-line bg-elev text-[13px] shadow-2xl",
            expanded ? "inset-x-0 bottom-0 max-h-[78svh] rounded-t-2xl" : "inset-x-3 bottom-3 rounded-2xl",
          )}
        >
          <div className="flex items-center gap-1 py-1.5 pr-1.5 pl-3">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{title}</span>
                <span className="block text-[11px] text-muted">{expanded ? dict.nav.close : dict.canvas.showDetails}</span>
              </span>
              <svg viewBox="0 0 12 12" className={cn("size-3 shrink-0 text-muted transition-transform", expanded && "rotate-180")} aria-hidden>
                <path d="M2 7.5 6 4l4 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            <Stepper {...props} />
          </div>
          {expanded && (
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line">
              <Details {...props} />
            </div>
          )}
        </motion.section>
      </div>
    </>
  );
}
