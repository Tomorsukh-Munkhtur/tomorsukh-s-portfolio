'use client';
import { createElement, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'li' | 'span' | 'p' | 'header' | 'article';
  className?: string;
  /** Delay before the entrance starts, in ms. */
  delay?: number;
  /** Starting vertical offset, in px. */
  y?: number;
  id?: string;
}

/** Fades, un-blurs and lifts its children into place the first time they scroll into view. */
export default function Reveal({ children, as = 'div', className, delay = 0, y = 32, id }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(
    as,
    {
      ref,
      id,
      className: className ? `reveal ${className}` : 'reveal',
      'data-shown': shown,
      style: { '--reveal-delay': `${delay}ms`, '--reveal-y': `${y}px` } as CSSProperties,
    },
    children,
  );
}
