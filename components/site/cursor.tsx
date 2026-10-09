"use client";

import { motion, useMotionValue } from "motion/react";
import { useEffect, useState } from "react";
import { useLocale } from "./locale-provider";

const COLOR = "#ff6b2c";

/**
 * Figma-style multiplayer cursor for the visitor: an arrow with a "You" tag.
 * Over elements with `data-cursor="Label"` the tag shows that label instead;
 * while the canvas is being dragged (html[data-grabbing]) it turns into a hand.
 */
export function Cursor() {
  const { dict } = useLocale();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const [label, setLabel] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");

    let current: string | null = null;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const next = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor]")?.dataset.cursor ?? null;
      if (next !== current) {
        current = next;
        setLabel(next);
      }
    };
    const onLeave = () => setVisible(false);
    const observer = new MutationObserver(() => setGrabbing(root.dataset.grabbing === "1"));
    observer.observe(root, { attributes: true, attributeFilter: ["data-grabbing"] });

    window.addEventListener("pointermove", onMove, { passive: true });
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.classList.remove("has-cursor");
      observer.disconnect();
      window.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[90]"
      style={{ x, y, opacity: visible ? 1 : 0 }}
    >
      {grabbing ? (
        <svg width="26" height="26" viewBox="0 0 24 24" className="-translate-x-3 -translate-y-3 drop-shadow">
          <path
            d="M8 11V6.5a1.5 1.5 0 0 1 3 0V10m0-4.5v-1a1.5 1.5 0 0 1 3 0V10m0-4a1.5 1.5 0 0 1 3 0v4.5m0-2.5a1.5 1.5 0 0 1 3 0v5.5a7 7 0 0 1-7 7h-1.2a6 6 0 0 1-4.6-2.2L4.6 15a1.6 1.6 0 0 1 2.4-2.1L8 14"
            fill="#fff"
            stroke="#111"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="22" height="24" viewBox="0 0 22 24" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
          <path d="M2 1.5 20 10.2l-7.6 2.1-3.6 7.4z" fill={COLOR} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )}
      {!grabbing && (
        <motion.span
          layout
          className="mt-0.5 ml-4 block w-max rounded-[5px] px-2 py-0.5 text-[12px] font-semibold text-white"
          style={{ background: COLOR }}
          transition={{ duration: 0.15 }}
        >
          {label ?? dict.canvas.you}
        </motion.span>
      )}
    </motion.div>
  );
}
