"use client";

import Lenis from "lenis";
import { useEffect } from "react";

let instance: Lenis | null = null;

/** Smoothly scroll to a position, falling back to native scrolling. */
export function scrollToTop() {
  if (instance) instance.scrollTo(0, { duration: 1.4 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    instance = new Lenis({ autoRaf: true, duration: 1.1, anchors: true });
    return () => {
      instance?.destroy();
      instance = null;
    };
  }, []);

  return null;
}
