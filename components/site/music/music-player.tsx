"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "../locale-provider";
import { setSoundEnabled, useSoundEnabled } from "../sound";
import { lofi, TRACKS } from "./lofi";

const KEYS = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const SERVER_STATE = { playing: false, track: 0, volume: 0.6 };

function Bars({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <span className={cn("flex h-3.5 items-end gap-[2px]", className)} aria-hidden>
      {[0.9, 0.5, 1, 0.65].map((h, i) => (
        <span
          key={i}
          className={cn(
            "w-[2px] origin-bottom rounded-full bg-current transition-opacity",
            playing ? "animate-[eq_0.9s_ease-in-out_infinite]" : "opacity-50",
          )}
          style={{ height: `${(playing ? h : h * 0.45) * 100}%`, animationDelay: `${i * 0.13}s` }}
        />
      ))}
    </span>
  );
}

/**
 * FigJam-style music widget: the pill plays/pauses the generative lo-fi radio,
 * the chevron opens track, volume and interface-sound controls.
 */
export function MusicPlayer() {
  const { dict } = useLocale();
  const m = dict.music;
  const state = useSyncExternalStore(lofi.subscribe, lofi.getState, () => SERVER_STATE);
  const uiSounds = useSoundEnabled();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const track = TRACKS[state.track];
  const trackName = m.tracks[state.track] ?? "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div className="flex h-9 items-center rounded-full border border-line transition-colors hover:border-line-strong">
        <button
          type="button"
          onClick={() => lofi.toggle()}
          aria-pressed={state.playing}
          aria-label={state.playing ? m.pause : m.play}
          title={state.playing ? m.pause : m.play}
          className="flex h-full items-center gap-2 pr-2 pl-3"
        >
          <Bars playing={state.playing} />
          <span className="hidden max-w-32 truncate text-xs md:inline">{state.playing ? trackName : m.open}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={m.title}
          className="grid h-full w-7 place-items-center border-l border-line pr-0.5 text-muted hover:text-fg"
        >
          <svg viewBox="0 0 12 12" className={cn("size-2.5 transition-transform", open && "rotate-180")} aria-hidden>
            <path d="M2 4.5 6 8l4-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={m.title}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="absolute top-full right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-line bg-elev p-4 text-sm shadow-2xl"
          >
            <p className="eyebrow mb-3">{m.title}</p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => lofi.toggle()}
                aria-label={state.playing ? m.pause : m.play}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg transition-transform active:scale-95"
              >
                {state.playing ? (
                  <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
                    <path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 16 16" className="ml-0.5 size-4" aria-hidden>
                    <path d="M4 2.5v11L13.5 8z" fill="currentColor" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{trackName}</p>
                <p className="flex items-center gap-2 font-mono text-[11px] text-muted">
                  <Bars playing={state.playing} className="h-2.5" />
                  {track.bpm} BPM · {KEYS[track.key]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => lofi.next()}
                aria-label={m.next}
                title={m.next}
                className="grid size-9 shrink-0 place-items-center rounded-full border border-line hover:border-line-strong"
              >
                <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                  <path d="M3 3v10l7-5zM11 3h2v10h-2z" fill="currentColor" />
                </svg>
              </button>
            </div>

            <label className="mt-4 flex items-center gap-3">
              <span className="sr-only">{m.volume}</span>
              <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-muted" aria-hidden>
                <path d="M2 6h3l4-3v10l-4-3H2z" fill="currentColor" />
                <path d="M11 5.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={state.volume}
                onChange={(e) => lofi.setVolume(Number(e.target.value))}
                className="w-full accent-fg"
              />
            </label>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <span className="text-muted">{m.uiSounds}</span>
              <button
                type="button"
                role="switch"
                aria-checked={uiSounds}
                onClick={() => setSoundEnabled(!uiSounds)}
                className={cn(
                  "relative h-5 w-9 rounded-full border transition-colors",
                  uiSounds ? "border-transparent bg-accent" : "border-line-strong",
                )}
              >
                <span
                  className={cn(
                    "absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full transition-all",
                    uiSounds ? "left-[18px] bg-accent-fg" : "left-[2px] bg-fg/70",
                  )}
                />
              </button>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-faint">{m.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
