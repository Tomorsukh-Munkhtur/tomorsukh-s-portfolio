'use client';
import { useEffect, useRef, type CSSProperties } from 'react';
import styles from './ScrollText.module.css';

/** A statement whose words light up one by one as it scrolls through the viewport. */
export default function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(' ');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--progress', '1');
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the block's top reaches 85% of the viewport, 1 when its bottom reaches 45%.
      const start = vh * 0.85;
      const end = vh * 0.45;
      const progress = (start - r.top) / (start - end + r.height);
      el.style.setProperty('--progress', Math.min(Math.max(progress, 0), 1).toFixed(3));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <p ref={ref} className={`${styles.text} ${className ?? ''}`} style={{ '--n': words.length } as CSSProperties}>
      {words.map((word, i) => (
        <span key={i} className={styles.word} style={{ '--i': i } as CSSProperties}>
          {word}{' '}
        </span>
      ))}
    </p>
  );
}
