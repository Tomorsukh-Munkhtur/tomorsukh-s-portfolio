'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSessionRemainingTime, logout } from '../app/lib/auth';

export default function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Initial check
    setTimeLeft(getSessionRemainingTime());

    const interval = setInterval(() => {
      const remaining = getSessionRemainingTime();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        logout();
        router.push('/admin/login');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [router]);

  if (timeLeft <= 0) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  return (
    <div style={{ 
      color: 'var(--text-secondary)', 
      fontSize: '0.9rem', 
      marginRight: '1rem',
      fontVariantNumeric: 'tabular-nums'
    }}>
      Идэвхтэй хугацаа: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
