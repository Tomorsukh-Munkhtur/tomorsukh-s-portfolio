'use client';
import { useEffect, useRef, type MutableRefObject } from 'react';
import { createMeadowScene, type MeadowInput } from './scene';

interface MeadowSceneProps {
  className?: string;
  /** Smoothed pointer in [-1, 1], shared with the hero's other parallax layers. */
  look: MutableRefObject<{ x: number; y: number }>;
  /** Called after the first frame is drawn, so the hero can fade the canvas in. */
  onReady?: () => void;
}

/** Mounts the three.js meadow and drives it while it is on screen. */
export default function MeadowScene({ className, look, onReady }: MeadowSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Fewer plants on small or low-core devices.
    const area = (window.innerWidth * window.innerHeight) / (1440 * 900);
    const cores = navigator.hardwareConcurrency || 4;
    const quality = Math.min(1, area) * (cores <= 4 ? 0.7 : 1);

    let meadow: ReturnType<typeof createMeadowScene>;
    try {
      meadow = createMeadowScene(mount, quality);
    } catch {
      return; // No WebGL: the CSS sky behind the canvas stays as the background.
    }

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const input: MeadowInput = { look: look.current, mouse: { x: 0, y: 0, active: false }, scroll: 0 };
    let time = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let ready = false;

    const draw = () => {
      input.look = look.current;
      input.scroll = Math.min(Math.max(window.scrollY / Math.max(mount.clientHeight, 1), 0), 1);
      meadow.update(reduceMotion ? 14 : time, input); // reduced motion: one still, fully bloomed frame
      meadow.render();
      if (!ready) {
        ready = true;
        onReadyRef.current?.();
      }
    };

    const loop = (now: number) => {
      time += Math.min((now - last) / 1000, 0.05);
      last = now;
      draw();
      frame = requestAnimationFrame(loop);
    };
    const start = () => {
      if (reduceMotion || frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      meadow.resize(mount.clientWidth, mount.clientHeight);
      if (reduceMotion || !frame) draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(mount);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    // Track the mouse over the hero so nearby flowers can lean away.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const r = mount.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      input.mouse.x = x * 2 - 1;
      input.mouse.y = 1 - y * 2;
      input.mouse.active = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    };
    const onLeave = () => (input.mouse.active = false);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);

    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      meadow.dispose();
    };
  }, [look]);

  return <div ref={mountRef} className={className} aria-hidden="true" />;
}
