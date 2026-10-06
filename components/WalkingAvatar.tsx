'use client';
import { useEffect, useRef } from 'react';
import { BASE_YAW, createAvatarScene } from './avatar/scene';

/** Interactive 3D avatar walking on a platform. Drag sideways to turn it. */
export default function WalkingAvatar({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const avatar = createAvatarScene(mount);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let time = 0.3; // a mid-stride pose for the first frame
    let dragYaw = 0;
    let yaw = 0;
    let visible = true;
    let frame = 0;
    let last = performance.now();

    const draw = () => {
      // Gentle idle sway so the figure reads as 3D even without interaction.
      const sway = reduceMotion ? 0 : 0.22 * Math.sin(time * 0.35);
      yaw += (dragYaw + sway - yaw) * 0.12;
      avatar.update(time, BASE_YAW + yaw);
      avatar.render();
    };

    const loop = (now: number) => {
      time += Math.min((now - last) / 1000, 0.1);
      last = now;
      draw();
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduceMotion || frame || !visible) return;
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const resize = () => {
      avatar.resize(mount.clientWidth, mount.clientHeight);
      draw();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    // Pause when scrolled out of view.
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(mount);

    // Drag to rotate.
    let dragX: number | null = null;
    const onDown = (e: PointerEvent) => {
      dragX = e.clientX;
      avatar.canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (dragX === null) return;
      dragYaw += (e.clientX - dragX) * 0.012;
      dragX = e.clientX;
      if (reduceMotion) {
        yaw = dragYaw;
        draw();
      }
    };
    const onUp = () => {
      dragX = null;
    };
    avatar.canvas.addEventListener('pointerdown', onDown);
    avatar.canvas.addEventListener('pointermove', onMove);
    avatar.canvas.addEventListener('pointerup', onUp);
    avatar.canvas.addEventListener('pointercancel', onUp);

    start();

    return () => {
      stop();
      io.disconnect();
      resizeObserver.disconnect();
      avatar.canvas.removeEventListener('pointerdown', onDown);
      avatar.canvas.removeEventListener('pointermove', onMove);
      avatar.canvas.removeEventListener('pointerup', onUp);
      avatar.canvas.removeEventListener('pointercancel', onUp);
      avatar.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={className}
      role="img"
      aria-label="Төмөрсүхийн алхаж буй 3D дүр"
      style={{ cursor: 'grab', touchAction: 'pan-y' }}
    />
  );
}
