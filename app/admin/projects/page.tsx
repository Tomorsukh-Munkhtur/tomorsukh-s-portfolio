'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '../../lib/auth';
import { getProjects, deleteProject, updateProject } from '../../lib/storage';
import { Project } from '../../lib/data';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    loadProjects();
  }, [router]);

  const loadProjects = () => {
    setProjects(getProjects());
  };

  const handleDelete = (id: string) => {
    if (confirm('Энэ төслийг устгахдаа итгэлтэй байна уу?')) {
      deleteProject(id);
      loadProjects();
    }
  };

  const toggleFeatured = (project: Project) => {
    updateProject(project.id, { featured: !project.featured });
    loadProjects();
  };

  const filteredProjects = filter
    ? projects.filter(p => p.category === filter)
    : projects;

  const categories = Array.from(new Set(projects.map(p => p.category)));

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>Төслүүд</h1>
        <Link href="/admin/projects/new" className="btn btn-primary">
          + Шинэ төсөл
        </Link>
      </div>

      <div className="mb-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="form-select"
          style={{ maxWidth: '300px' }}
        >
          <option value="">Бүх ангилал</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Гарчиг</th>
              <th>Ангилал</th>
              <th>Онцлох</th>
              <th>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{project.title}</div>
                  <div className="text-secondary text-sm" style={{ marginTop: '0.25rem' }}>
                    {project.description.substring(0, 60)}...
                  </div>
                </td>
                <td>{project.category}</td>
                <td>
                  <button
                    onClick={() => toggleFeatured(project)}
                    className={`badge ${project.featured ? 'badge-success' : 'badge-warning'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {project.featured ? '⭐ Тийм' : 'Үгүй'}
                  </button>
                </td>
                <td>
                  <div className="flex gap-1">
                    <Link
                      href={`/admin/projects/edit/${project.id}`}
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Засах
                    </Link>
                    <button
                      onClick={() => handleDelete(project.id)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      Устгах
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--admin-text-secondary)' }}>
          Төсөл олдсонгүй
        </div>
      )}
    </div>
  );
}