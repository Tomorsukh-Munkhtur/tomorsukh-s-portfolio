'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Хяналтын самбар', icon: '📊' },
    { href: '/admin/projects', label: 'Төслүүд', icon: '📁' },
    { href: '/admin/categories', label: 'Ангилал', icon: '🏷️' },
    { href: '/admin/messages', label: 'Зурвасууд', icon: '✉️' },
  ];

  return (
    <aside className={styles.adminSidebar}>
      <div className={styles.logo}>
        <h2>Tomorsukh</h2>
        <p style={{ color: 'var(--admin-text-secondary)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
          Админ
        </p>
      </div>
      <nav>
        <ul className={styles.nav}>
          {navItems.map((item) => (
            <li key={item.href} className={styles.navItem}>
              <Link
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}