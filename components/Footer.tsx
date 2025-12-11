import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.logo}>Tomorsukh&lsquo;s portfolio</div>
          
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
            <a href="https://dribbble.com/Tomorsukh" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Dribbble">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M8.56 2.75c4.37 6.03 6.02 9.42 8.03 17.72m2.54-15.38c-3.72 4.35-8.94 5.66-16.88 5.85m19.5 1.9c-3.5-.93-6.63-.82-8.94 0-2.58.92-5.01 2.86-7.44 6.32"></path>
              </svg>
            </a>
            <a href="https://www.behance.net/Tomorsukh" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Behance">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h6.5a2.5 2.5 0 1 1 0 5H3V8z"></path>
                <path d="M3 13h7a2.5 2.5 0 1 1 0 5H3v-5z"></path>
                <path d="M14 7h7"></path>
                <path d="M17.5 11a3.5 3.5 0 1 1 0 7h-1a3.5 3.5 0 0 1-3.5-3.5V14a3.5 3.5 0 0 1 3.5-3.5h1z"></path>
              </svg>
            </a>
            <a href="https://www.instagram.com/tomoroo.s_photo1/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>

          <p className={styles.copyright}>
            © {currentYear} Tomorsukh UI/UX Design. Бүх эрх хуулиар хамгаалагдсан.
          </p>
        </div>
      </div>
    </footer>
  );
}
