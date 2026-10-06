'use client';
import { useEffect, useRef, type MutableRefObject } from 'react';

type Pointer = { x: number; y: number };

interface HeroParticlesProps {
  className?: string;
  /** Smoothed pointer position in [-1, 1]; nearer particles drift further with it. */
  pointer?: MutableRefObject<Pointer>;
  /** Particles per 10 000 px² of canvas. */
  density?: number;
}

type Particle = {
  x: number;
  y: number;
  z: number; // depth: 0 = far, 1 = near
  r: number;
  vy: number;
  drift: number;
  phase: number;
  twinkle: number;
  sprite: HTMLCanvasElement;
};

// Warm white, pink, lavender, white and the teal sparkles found in the meadow image.
const COLORS = ['255, 226, 190', '249, 168, 212', '196, 181, 253', '255, 255, 255', '165, 243, 252'];
const SPRITE_SIZE = 64;
const MAX_PARTICLES = 140;

function makeSprite(rgb: string) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE_SIZE;
  const g = c.getContext('2d')!;
  const half = SPRITE_SIZE / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${rgb}, 1)`);
  grad.addColorStop(0.16, `rgba(${rgb}, 0.9)`);
  grad.addColorStop(0.42, `rgba(${rgb}, 0.2)`);
  grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE);
  return c;
}

/** Glowing firefly-like specks rising out of the meadow, drawn on a canvas. */
export default function HeroParticles({ className, pointer, density = 0.55 }: HeroParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Pre-rendered glow sprites are far cheaper than a gradient per particle per frame.
    const sprites = COLORS.map(makeSprite);
    let particles: Particle[] = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let time = 0;

    const spawn = (initial: boolean): Particle => {
      const z = Math.random() ** 1.7; // mostly far and small, a few near and big
      return {
        x: Math.random() * w,
        y: initial ? h * (0.2 + Math.random() * 0.8) : h + 20 + Math.random() * 40,
        z,
        r: 2.5 + z * z * 15,
        vy: 6 + z * 28,
        drift: 6 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.6 + Math.random() * 1.8,
        sprite: sprites[(Math.random() * sprites.length) | 0],
      };
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(MAX_PARTICLES, Math.max(16, Math.round(((w * h) / 10000) * density)));
      while (particles.length < target) particles.push(spawn(true));
      particles.length = target;
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      const px = pointer?.current.x ?? 0;
      const py = pointer?.current.y ?? 0;
      const fadeTop = h * 0.32;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.y -= p.vy * dt;
        p.x += Math.sin(time * 0.5 + p.phase) * p.drift * dt;
        if (p.y < -30) particles[i] = spawn(false);

        const twinkle = 0.55 + 0.45 * Math.sin(time * p.twinkle + p.phase);
        const fade = Math.min(1, Math.max(0, p.y / fadeTop), Math.max(0, (h + 40 - p.y) / 80));
        const alpha = (0.3 + p.z * 0.6) * twinkle * fade;
        if (alpha <= 0.01) continue;

        const x = p.x - px * 42 * p.z;
        const y = p.y - py * 26 * p.z;
        ctx.globalAlpha = alpha;
        ctx.drawImage(p.sprite, x - p.r, y - p.r, p.r * 2, p.r * 2);
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      time += dt;
      draw(dt);
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

    const ro = new ResizeObserver(() => {
      resize();
      if (reduceMotion) draw(0);
    });
    ro.observe(canvas);
    resize();
    draw(0);

    // Only animate while the canvas is on screen and the tab is visible.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pointer, density]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
