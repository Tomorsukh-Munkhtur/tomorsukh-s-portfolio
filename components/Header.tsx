import Link from 'next/link';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <nav className="container">
        <div className={styles.nav}>
          <Link href="/" className={styles.logo}>
            Tomorsukh s Portfolio
          </Link>
          <ul className={styles.navLinks}>
            <li>
              <Link href="/" className={styles.navLink}>
                Нүүр хуудас
              </Link>
            </li>
            <li>
              <Link href="/projects" className={styles.navLink}>
                Төслүүд
              </Link>
            </li>
            <li>
              <Link href="/about" className={styles.navLink}>
                Миний тухай
              </Link>
            </li>
            <li>
              <Link href="/contact" className={styles.navLink}>
                Холбоо барих
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
}
