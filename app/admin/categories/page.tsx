'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../lib/auth';
import { getCategories, addCategory, deleteCategory } from '../../lib/storage';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/admin/login');
      return;
    }
    loadCategories();
  }, [router]);

  const loadCategories = () => {
    setCategories(getCategories());
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    if (addCategory(newCategory.trim())) {
      setNewCategory('');
      setError('');
      loadCategories();
    } else {
      setError('Энэ ангилал аль хэдийн байна');
    }
  };

  const handleDelete = (category: string) => {
    if (confirm(`"${category}" ангиллыг устгахдаа итгэлтэй байна уу?`)) {
      if (deleteCategory(category)) {
        loadCategories();
      } else {
        alert('Алдаа гарлаа');
      }
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Ангилал удирдах</h1>

      <div className="card mb-4" style={{ maxWidth: '600px' }}>
        <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Шинэ ангилал нэмэх</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="form-input"
            placeholder="Ангиллын нэр"
            required
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-primary">
            Нэмэх
          </button>
        </form>
        {error && <p style={{ color: 'var(--admin-danger)', marginTop: '0.5rem', fontSize: '0.875rem' }}>{error}</p>}
      </div>

      <div className="card" style={{ maxWidth: '600px', padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ангиллын нэр</th>
              <th style={{ width: '100px', textAlign: 'right' }}>Үйлдэл</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category}>
                <td>{category}</td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(category)}
                    className="btn btn-danger"
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    Устгах
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}