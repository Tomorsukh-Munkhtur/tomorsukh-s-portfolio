"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
 * Tiny UI sounds (hover tick, click) synthesised with the Web Audio API.
 * Off by default; toggled from the music player and remembered in localStorage.
 */

const KEY = "sound";
let enabled = false;
let ctx: AudioContext | null = null;
const listeners = new Set<() => void>();

export function setSoundEnabled(value: boolean) {
  enabled = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {}
  listeners.forEach((l) => l());
}

function audio() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, { duration = 0.08, gain = 0.03, type = "sine" as OscillatorType, slideTo = 0, delay = 0 } = {}) {
  if (!enabled) return;
  const ac = audio();
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const amp = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + duration);
  amp.gain.setValueAtTime(0, t);
  amp.gain.linearRampToValueAtTime(gain, t + 0.006);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(amp).connect(ac.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

const sounds = {
  hover: () => tone(2400, { duration: 0.035, gain: 0.012 }),
  click: () => tone(520, { duration: 0.09, gain: 0.04, type: "triangle", slideTo: 260 }),
  on: () => {
    tone(660, { duration: 0.12, gain: 0.035 });
    tone(990, { duration: 0.16, gain: 0.03, delay: 0.08 });
  },
};

export function useSoundEnabled() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => enabled,
    () => false,
  );
}

/** Global listeners: a soft tick when hovering links/buttons, a click on press. */
export function SoundEffects() {
  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) === "1") {
        enabled = true;
        listeners.forEach((l) => l());
      }
    } catch {}

    let last: Element | null = null;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as Element).closest("a, button, [data-cursor]");
      if (target && target !== last) sounds.hover();
      last = target;
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest("a, button, [role=button], [data-cursor]")) sounds.click();
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return null;
}
