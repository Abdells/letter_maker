'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewTemplate() {
  const [form, setForm] = useState({
    category: '',
    type: '',
    title: '',
    content: '',
    placeholders: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Submitting form data:', form);

      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          placeholders: form.placeholders.split(',').map(p => p.trim())
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Save failed - ${response.status}: ${errorText}`);
      }

      const newTemplate = await response.json();
      console.log('New template created:', newTemplate);

      router.push('/admin');
    } catch (err: any) {
      console.error('Add template error:', err);
      setError(err.message || 'Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: 'auto' }}>
      <h1>Add New Template</h1>

      {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Category (e.g. teachers)"
          value={form.category}
          onChange={e => setForm({ ...form, category: e.target.value })}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />
        <input
          placeholder="Type (e.g. leave-application)"
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />
        <input
          placeholder="Title (e.g. Application for Leave)"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />
        <textarea
          placeholder="Full letter content with {{placeholders}}"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
          rows={15}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />
        <input
          placeholder="Placeholders (comma-separated, e.g. date, leaveType, duration)"
          value={form.placeholders}
          onChange={e => setForm({ ...form, placeholders: e.target.value })}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{
            padding: '1rem 2rem',
            background: loading ? '#ccc' : '#0d6efd',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Saving...' : 'Save Template'}
        </button>
      </form>
    </div>
  );
}
