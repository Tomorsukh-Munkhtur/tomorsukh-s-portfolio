'use client';
import Image from 'next/image';
import type { ReactNode } from 'react';
import HeroParticles from './HeroParticles';
import Reveal from './Reveal';
import styles from './PageHero.module.css';

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}

/** Shorter hero for inner pages: a dimmed slice of the meadow image behind the page title. */
export default function PageHero({ eyebrow, title, subtitle, children }: PageHeroProps) {
  return (
    <section className={styles.pageHero}>
      <div className={styles.bg} aria-hidden="true">
        <Image src="/hero/meadow-960.webp" alt="" fill sizes="100vw" className={styles.bgImage} />
        <HeroParticles className={styles.particles} density={0.3} />
      </div>
      <div className={`container ${styles.inner}`}>
        <Reveal y={16}>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <Reveal delay={90}>
          <h1 className={styles.title}>{title}</h1>
        </Reveal>
        {subtitle && (
          <Reveal delay={180}>
            <p className={styles.subtitle}>{subtitle}</p>
          </Reveal>
        )}
        {children && (
          <Reveal delay={260} className={styles.extra}>
            {children}
          </Reveal>
        )}
      </div>
    </section>
  );
}
