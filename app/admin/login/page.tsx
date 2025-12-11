'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../../lib/auth';
import '../admin.css';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      router.push('/admin');
    } else {
      setError('Нууц үг буруу байна');
      setPassword('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--admin-bg)',
      padding: '2rem'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--admin-accent)', marginBottom: '0.5rem' }}>
            Tomorsukh
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)' }}>Админ хяналтын самбар</p>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">Нууц үг</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="Нууц үгээ оруулна уу"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--admin-text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {error && (
              <p style={{ color: 'var(--admin-danger)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {error}
              </p>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Нэвтрэх
          </button>

          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-secondary)', textAlign: 'center' }}>
            Анхдагч нууц үг: admin123
          </p>
        </form>
      </div>
    </div>
  );
}