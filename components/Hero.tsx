'use client';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import HeroParticles from './HeroParticles';
import styles from './Hero.module.css';

// three.js needs the browser; the CSS sky shows until the meadow's first frame.
const MeadowScene = dynamic(() => import('./meadow/MeadowScene'), { ssr: false });

const WORDS = ['Энгийн', 'Ухаалаг', 'Хөнгөн', 'Хэрэглэгч төвтэй', 'Цэвэрхэн', 'Дэгжин'];
const WORD_MS = 2800;
const FIRST_WORD_DELAY = 900; // wait for the dawn intro before the first word lands

// Violet → pink → peach, matching the sky; sampled per letter so each letter
// carries its own slice of one continuous gradient (safe with per-letter transforms).
const STOPS = [
  [196, 181, 253],
  [249, 168, 212],
  [254, 215, 170],
];
function gradientAt(t: number) {
  const seg = Math.min(Math.max(t, 0), 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(seg), STOPS.length - 2);
  const f = seg - i;
  const [a, b] = [STOPS[i], STOPS[i + 1]];
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(', ')})`;
}

function RotatingWord({ word, first }: { word: string; first: boolean }) {
  const total = word.replace(/\s/g, '').length;
  const hold = (first ? WORD_MS + FIRST_WORD_DELAY : WORD_MS) - 560;
  // Number every letter across the whole phrase so the stagger and gradient run continuously.
  let offset = 0;
  const parts = word.split(' ').map((part) => {
    const letters = Array.from(part, (ch, j) => ({ ch, i: offset + j }));
    offset += letters.length;
    return letters;
  });

  return (
    <span
      className={`${styles.word} ${total > 10 ? styles.wordLong : ''}`}
      style={{ '--start': `${first ? FIRST_WORD_DELAY : 0}ms`, '--hold': `${hold}ms` } as CSSProperties}
    >
      {parts.map((letters, wi) => (
        <Fragment key={wi}>
          {wi > 0 && ' '}
          <span className={styles.wordPart}>
            {letters.map(({ ch, i }) => (
              <span
                key={i}
                className={styles.letter}
                style={
                  {
                    '--i': i,
                    backgroundImage: `linear-gradient(90deg, ${gradientAt(i / total)}, ${gradientAt((i + 1) / total)})`,
                  } as CSSProperties
                }
              >
                {ch}
              </span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [cycle, setCycle] = useState(0);
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCycle((c) => c + 1), cycle === 0 ? WORD_MS + FIRST_WORD_DELAY : WORD_MS);
    return () => clearTimeout(t);
  }, [cycle]);

  // Mouse + scroll parallax, written as CSS variables so React never re-renders.
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const target = { x: 0, y: 0 };
    let height = hero.offsetHeight;
    let frame = 0;
    let visible = true;

    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const onResize = () => (height = hero.offsetHeight);

    const tick = () => {
      const p = pointer.current;
      p.x += (target.x - p.x) * 0.06;
      p.y += (target.y - p.y) * 0.06;
      const progress = Math.min(Math.max(window.scrollY / height, 0), 1);
      hero.style.setProperty('--mx', p.x.toFixed(4));
      hero.style.setProperty('--my', p.y.toFixed(4));
      hero.style.setProperty('--p', progress.toFixed(4));
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!frame && visible) frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(hero);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('resize', onResize);
    start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section ref={heroRef} className={styles.hero}>
      <div className={styles.scene} aria-hidden="true">
        <div className={styles.meadow} data-ready={sceneReady}>
          <MeadowScene className={styles.meadowCanvas} look={pointer} onReady={() => setSceneReady(true)} />
        </div>
        <div className={styles.shade} />
        <HeroParticles className={styles.particles} pointer={pointer} density={0.4} />
      </div>

      <div className={`container ${styles.top}`}>
        <p className={styles.badge}>
          <span className={styles.badgeDot} />
          Төмөрсүх · UI/UX Дизайнер
        </p>
        <h1 className={styles.title} aria-label="Энгийн, ухаалаг, хэрэглэгч төвтэй дизайн">
          <span aria-hidden="true" className={styles.wordSlot}>
            <RotatingWord key={cycle} word={WORDS[cycle % WORDS.length]} first={cycle === 0} />
          </span>
          <span aria-hidden="true" className={styles.titleBase}>
            дизайн
          </span>
        </h1>
      </div>

      <div className={`container ${styles.bottom}`}>
        <p className={styles.subtitle}>
          Би хэрэглэгч төвтэй, цэвэрхэн дизайн бүтээж, нарийн төвөгтэй асуудлыг энгийн, дэгжин шийдэл болгон
          хувиргадаг. Веб болон мобайл интерфэйсээр төрөлждөг.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/projects" className={styles.cta}>
            Миний ажлууд
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <Link href="/contact" className={styles.ctaSecondary}>
            Холбоо барих
          </Link>
        </div>
      </div>

      <a href="#work" className={styles.scrollCue} aria-label="Доош гүйлгэх">
        <span>Гүйлгэх</span>
        <span className={styles.scrollLine} />
      </a>
    </section>
  );
}
