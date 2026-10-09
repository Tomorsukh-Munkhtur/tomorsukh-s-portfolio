"use client";

import { motion } from "motion/react";
import { useLocale } from "../locale-provider";

/** Keyboard shortcut cheat sheet (toggled with "?"). */
export function Shortcuts({ onClose }: { onClose: () => void }) {
  const { dict } = useLocale();
  const keys = dict.canvas.keys;
  const rows = [keys.pan, keys.zoom, keys.plusMinus, keys.fit, keys.actual, keys.frame, keys.arrows, keys.help];

  return (
    <motion.div
      role="dialog"
      aria-label={dict.canvas.shortcuts}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="w-72 rounded-2xl border border-line bg-elev p-4 text-sm shadow-2xl"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-medium">{dict.canvas.shortcuts}</p>
        <button type="button" onClick={onClose} className="text-muted hover:text-fg" aria-label={dict.nav.close}>
          ✕
        </button>
      </div>
      <ul className="space-y-1.5">
        {rows.map((row) => {
          const [key, ...rest] = row.split(" — ");
          return (
            <li key={row} className="flex items-baseline justify-between gap-3">
              <span className="text-muted">{rest.join(" — ")}</span>
              <kbd className="shrink-0 rounded-md border border-line px-1.5 py-0.5 font-mono text-[11px]">{key}</kbd>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
