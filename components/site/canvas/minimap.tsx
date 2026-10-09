"use client";

import { motion, useTransform } from "motion/react";
import { useRef, type PointerEvent } from "react";
import type { FrameBox } from "@/lib/canvas-layout";
import type { Camera, Rect } from "./camera";

const MAP_W = 200;
const MAP_H_MAX = 140;

/** Overview of the whole canvas with the visible area; click or drag to move there. */
export function Minimap({ frames, bounds, camera, label }: { frames: FrameBox[]; bounds: Rect; camera: Camera; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const s = Math.min(MAP_W / bounds.w, MAP_H_MAX / bounds.h);
  const w = bounds.w * s;
  const h = bounds.h * s;
  const { x, y, z, vw, vh } = camera;

  const left = useTransform(() => (-x.get() / z.get() - bounds.x) * s);
  const top = useTransform(() => (-y.get() / z.get() - bounds.y) * s);
  const width = useTransform(() => (vw.get() / z.get()) * s);
  const height = useTransform(() => (vh.get() / z.get()) * s);

  const moveTo = (e: PointerEvent<HTMLDivElement>, smooth: boolean) => {
    const r = ref.current!.getBoundingClientRect();
    const wx = (e.clientX - r.left) / s + bounds.x;
    const wy = (e.clientY - r.top) / s + bounds.y;
    const zoom = z.get();
    const tx = vw.get() / 2 - wx * zoom;
    const ty = vh.get() / 2 - wy * zoom;
    if (smooth) camera.flyTo(tx, ty, zoom, 0.6);
    else {
      camera.stop();
      x.set(tx);
      y.set(ty);
    }
  };

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className="relative cursor-pointer overflow-hidden rounded-xl"
      style={{ width: w, height: h }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        moveTo(e, true);
      }}
      onPointerMove={(e) => e.buttons === 1 && moveTo(e, false)}
    >
      {frames.map((f) => (
        <div
          key={f.id}
          className="absolute rounded-[3px] bg-fg/25"
          style={{ left: (f.x - bounds.x) * s, top: (f.y - bounds.y) * s, width: f.w * s, height: f.h * s }}
        />
      ))}
      <motion.div
        className="pointer-events-none absolute rounded-[3px] border-[1.5px] border-fg bg-fg/10"
        style={{ left, top, width, height }}
      />
    </div>
  );
}
