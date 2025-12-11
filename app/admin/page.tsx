'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../lib/auth';
import { getProjects } from '../lib/storage';
import Link from 'next/link';
import '../admin/admin.css';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    categories: {} as Record<string, number>
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }

    const projects = getProjects();
    const categoryCount: Record<string, number> = {};
    
    projects.forEach(p => {
      categoryCount[p.category] = (categoryCount[p.category] || 0) + 1;
    });

    setStats({
      total: projects.length,
      featured: projects.filter(p => p.featured).length,
      categories: categoryCount
    });
  }, [router]);

  return (
    <div className="admin-container">
      <div className="admin-main">
        <div className="flex justify-between items-center mb-4">
          <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Хяналтын самбар</h1>
          <Link href="/admin/projects/new" className="btn btn-primary">
            + Шинэ төсөл
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
              Нийт төслүүд
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--admin-accent)' }}>
              {stats.total}
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', margin: '0 0 0.5rem 0', textTransform: 'uppercase' }}>
              Онцлох төслүүд
            </h3>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, color: 'var(--admin-success)' }}>
              {stats.featured}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Ангиллаар</h2>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {Object.entries(stats.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between items-center" style={{ padding: '0.75rem', background: 'var(--admin-bg)', borderRadius: '8px' }}>
                <span>{category}</span>
                <span className="badge badge-success">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <Link href="/admin/projects" className="btn btn-secondary">
            Бүх төслүүдийг харах →
          </Link>
        </div>
      </div>
    </div>
  );
}