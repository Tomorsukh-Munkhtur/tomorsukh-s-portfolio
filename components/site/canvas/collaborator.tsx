"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useState } from "react";

export type Stop = { x: number; y: number; message: string };

const COLOR = "#d4ff3f";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * A Figma-style multiplayer cursor that tours the canvas, pointing at work and
 * leaving short notes. Lives in world space but keeps a constant on-screen size.
 */
export function Collaborator({ name, stops, zoom }: { name: string; stops: Stop[]; zoom: MotionValue<number> }) {
  const x = useMotionValue(stops[0]?.x ?? 0);
  const y = useMotionValue(stops[0]?.y ?? 0);
  const scale = useTransform(zoom, (v) => 1 / v);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (stops.length === 0) return;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    (async () => {
      await sleep(1400);
      if (cancelled) return;
      setMessage(stops[0].message);
      if (reduced || stops.length < 2) return;
      let i = 0;
      while (!cancelled) {
        await sleep(3600);
        if (cancelled) return;
        setMessage(null);
        i = (i + 1) % stops.length;
        const ease = [0.6, 0, 0.3, 1] as const;
        const distance = Math.hypot(stops[i].x - x.get(), stops[i].y - y.get());
        const duration = Math.min(2.4, 0.9 + distance / 2200);
        await Promise.all([animate(x, stops[i].x, { duration, ease }), animate(y, stops[i].y, { duration, ease })]);
        if (cancelled) return;
        setMessage(stops[i].message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [stops, x, y]);

  if (stops.length === 0) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-20 origin-top-left"
      style={{ x, y, scale }}
    >
      <svg width="22" height="24" viewBox="0 0 22 24" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]">
        <path d="M2 1.5 20 10.2l-7.6 2.1-3.6 7.4z" fill={COLOR} stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <div className="mt-0.5 ml-4 flex flex-col items-start gap-1">
        <span className="rounded-[5px] px-2 py-0.5 text-[12px] font-semibold text-[#111]" style={{ background: COLOR }}>
          {name}
        </span>
        <AnimatePresence>
          {message && (
            <motion.span
              key={message}
              initial={{ opacity: 0, y: -4, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className="w-max max-w-[min(240px,42vw)] rounded-[10px] rounded-tl-[2px] px-3 py-2 text-[13px] leading-snug font-medium text-[#111] shadow-lg"
              style={{ background: COLOR }}
            >
              {message}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
