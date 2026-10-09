"use client";

import { animate, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { useCallback, useMemo, useRef } from "react";

export const MIN_ZOOM = 0.12;
export const MAX_ZOOM = 2.5;
const EASE = [0.65, 0, 0.35, 1] as const;

export const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Pan/zoom camera as motion values, so moving around never re-renders React.
 * A world point p appears on screen at p * z + (x, y).
 */
export function useCamera() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const z = useMotionValue(1);
  const vw = useMotionValue(0);
  const vh = useMotionValue(0);
  const anims = useRef<AnimationPlaybackControls[]>([]);
  const frame = useRef(0);

  const stop = useCallback(() => {
    anims.current.forEach((a) => a.stop());
    anims.current = [];
    cancelAnimationFrame(frame.current);
  }, []);

  const zoomAt = useCallback(
    (sx: number, sy: number, factor: number) => {
      const z0 = z.get();
      const z1 = clampZoom(z0 * factor);
      const k = z1 / z0;
      x.set(sx - (sx - x.get()) * k);
      y.set(sy - (sy - y.get()) * k);
      z.set(z1);
    },
    [x, y, z],
  );

  const flyTo = useCallback(
    (tx: number, ty: number, tz: number, duration = 0.9) => {
      stop();
      if (duration === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        x.set(tx);
        y.set(ty);
        z.set(tz);
        return;
      }
      anims.current = [
        animate(x, tx, { duration, ease: EASE }),
        animate(y, ty, { duration, ease: EASE }),
        animate(z, tz, { duration, ease: EASE }),
      ];
    },
    [stop, x, y, z],
  );

  /**
   * Camera that frames `rect` inside the visible area (screen space), never above
   * `maxZoom`. `alignTop` pins it to the top instead of centring it vertically.
   */
  const fit = useCallback(
    (rect: Rect, view: Rect, maxZoom = 1, duration = 0.9, alignTop = false) => {
      const tz = clampZoom(Math.min(view.w / rect.w, view.h / rect.h, maxZoom));
      flyTo(
        view.x + (view.w - rect.w * tz) / 2 - rect.x * tz,
        view.y + (alignTop ? 0 : (view.h - rect.h * tz) / 2) - rect.y * tz,
        tz,
        duration,
      );
    },
    [flyTo],
  );

  /** Keep gliding after a drag, slowing down smoothly. Velocity in px per ms. */
  const glide = useCallback(
    (vx: number, vy: number) => {
      stop();
      let last = performance.now();
      const step = (t: number) => {
        const dt = Math.min(32, t - last);
        last = t;
        const decay = Math.pow(0.93, dt / 16);
        vx *= decay;
        vy *= decay;
        x.set(x.get() + vx * dt);
        y.set(y.get() + vy * dt);
        if (Math.hypot(vx, vy) > 0.015) frame.current = requestAnimationFrame(step);
      };
      frame.current = requestAnimationFrame(step);
    },
    [stop, x, y],
  );

  return useMemo(
    () => ({ x, y, z, vw, vh, stop, zoomAt, flyTo, fit, glide }),
    [x, y, z, vw, vh, stop, zoomAt, flyTo, fit, glide],
  );
}

export type Camera = ReturnType<typeof useCamera>;
