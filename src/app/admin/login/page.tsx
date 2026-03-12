'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (password === '@#1200=Maara') { // Match middleware password
      document.cookie = 'admin-auth=your-secret-password; path=/; max-age=86400'; // 1 day cookie
      router.push('/admin');
    } else {
      alert('Wrong password');
    }
  };

  return (
    <div style={{ padding: '4rem', maxWidth: 400, margin: 'auto', textAlign: 'center' }}>
      <h1>Admin Login</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        placeholder="Enter password"
      />
      <button onClick={handleLogin} style={{ padding: '1rem 2rem', background: '#0d6efd', color: 'white', border: 'none' }}>
        Login
      </button>
    </div>
  );
}