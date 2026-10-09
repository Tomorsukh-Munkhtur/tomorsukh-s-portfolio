"use client";

import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

type Themes = { key: string; values: readonly [string, string] };

function applyTheme(themes: Themes, next: string) {
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(themes.key, next);
  } catch {}
}

/** Switches between the two themes of an area (site: brand ↔ paper, admin: dark ↔ light). */
export function ThemeToggle({
  label,
  themes,
  className,
}: {
  label: string;
  themes: Themes;
  className?: string;
}) {
  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const [first, second] = themes.values;
    const next = document.documentElement.dataset.theme === second ? first : second;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || reduced) {
      applyTheme(themes, next);
      return;
    }

    // Reveal the new theme as a circle expanding from the button.
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const transition = document.startViewTransition(() => applyTheme(themes, next));
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 750,
          easing: "cubic-bezier(0.65, 0, 0.35, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-line text-fg transition-colors hover:border-line-strong",
        className,
      )}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="size-4 transition-transform duration-700 ease-out-expo light:rotate-180"
      >
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 3.5a8.5 8.5 0 0 1 0 17z" fill="currentColor" />
      </svg>
    </button>
  );
}
