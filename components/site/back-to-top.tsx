"use client";

import { scrollToTop } from "./smooth-scroll";

export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={scrollToTop}
      className="group inline-flex items-center gap-2 text-muted transition-colors hover:text-fg"
    >
      {label}
      <span className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">↑</span>
    </button>
  );
}
