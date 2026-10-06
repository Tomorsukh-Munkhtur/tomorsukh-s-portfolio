'use client';
import Link from 'next/link';
import { SOCIALS } from './socials';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoMark} aria-hidden="true" />
              Tomorsukh&lsquo;s portfolio
            </Link>
            <p className={styles.tagline}>Хэрэглэгч төвтэй, цэвэрхэн, дэгжин дижитал туршлага бүтээдэг.</p>
          </div>

          <ul className={styles.links}>
            <li>
              <Link href="/projects" className={styles.link}>
                Хийж байсан төслүүд
              </Link>
            </li>
            <li>
              <Link href="/about" className={styles.link}>
                Миний тухай
              </Link>
            </li>
            <li>
              <Link href="/contact" className={styles.link}>
                Холбоо барих
              </Link>
            </li>
          </ul>

          <div className={styles.social}>
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Tomorsukh UI/UX Design. Бүх эрх хуулиар хамгаалагдсан.
          </p>
          <button type="button" className={styles.toTop} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            Дээш буцах
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.wordmark} aria-hidden="true">
        TOMORSUKH
      </div>
    </footer>
  );
}
