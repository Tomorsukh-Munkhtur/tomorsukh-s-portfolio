'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated, logout } from '../lib/auth';
import AdminSidebar from '@/components/AdminSidebar';
import SessionTimer from '@/components/SessionTimer';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/admin/login' && !isAuthenticated()) {
      router.push('/admin/login');
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="admin-container">
      <AdminSidebar />
      <div className="admin-main">
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '2rem' }}>
          <SessionTimer />
          <button onClick={handleLogout} className="btn btn-secondary">
            Гарах
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
