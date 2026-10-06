'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type CSSProperties } from 'react';
import styles from './Header.module.css';

const LINKS = [
  { href: '/', label: 'Нүүр хуудас' },
  { href: '/projects', label: 'Төслүүд' },
  { href: '/about', label: 'Миний тухай' },
  { href: '/contact', label: 'Холбоо барих' },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  // Solidify after leaving the top; slide away while scrolling down, return on scroll up.
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - lastY) > 6) {
        setHidden(y > lastY && y > 160);
        lastY = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={styles.header}
      data-scrolled={scrolled || menuOpen}
      data-hidden={hidden && !menuOpen}
    >
      <nav className={styles.nav} aria-label="Үндсэн цэс">
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          Tomorsukh
        </Link>

        <ul className={styles.navLinks}>
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={styles.navLink}
                data-active={isActive(link.href)}
                aria-current={isActive(link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={styles.burger}
          data-open={menuOpen}
          aria-label={menuOpen ? 'Цэс хаах' : 'Цэс нээх'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
        </button>
      </nav>

      <div id="mobile-menu" className={styles.mobileMenu} data-open={menuOpen} aria-hidden={!menuOpen}>
        <ul>
          {LINKS.map((link, i) => (
            <li key={link.href} style={{ '--i': i } as CSSProperties}>
              <Link
                href={link.href}
                className={styles.mobileLink}
                data-active={isActive(link.href)}
                tabIndex={menuOpen ? undefined : -1}
                onClick={() => setMenuOpen(false)}
              >
                <span className={styles.mobileIndex}>0{i + 1}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <a href="mailto:tomorsukh.official@gmail.com" className={styles.mobileMail} tabIndex={menuOpen ? undefined : -1}>
          tomorsukh.official@gmail.com
        </a>
      </div>
    </header>
  );
}
