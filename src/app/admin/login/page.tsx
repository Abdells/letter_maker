'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
      } else {
        setError('Wrong password. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{ padding: '4rem', maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
      <h1>Admin Login</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        placeholder="Enter password"
        disabled={loading}
      />
      {error && (
        <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>
      )}
      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ padding: '1rem 2rem', background: '#0d6efd', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </div>
  );
}
