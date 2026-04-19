'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function EditTemplate() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: '',
    type: '',
    title: '',
    content: '',
    placeholders: ''
  });

  useEffect(() => {
    if (!id) {
      setError('Template ID is missing');
      setLoading(false);
      return;
    }

    fetch(`/api/admin/templates?id=${id}`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load template - ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log('Loaded template:', data); // Debug: check what comes back
        setForm({
          category: data.category || '',
          type: data.type || '',
          title: data.title || '',
          content: data.content || '',
          placeholders: data.placeholders ? data.placeholders.join(', ') : ''
        });
      })
      .catch(err => {
        console.error('Edit fetch error:', err);
        setError(err.message || 'Failed to load template');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...form,
          placeholders: form.placeholders.split(',').map(p => p.trim())
        })
      });
      if (!res.ok) throw new Error('Update failed');
      router.push('/admin');
    } catch (err) {
      alert('Update failed: ' + err.message);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading template...</div>;
  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: 'auto' }}>
      <h1>Edit Template</h1>
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
          placeholder="Title"
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
        <button type="submit" style={{ padding: '1rem 2rem', background: '#0d6efd', color: 'white', border: 'none' }}>
          Update Template
        </button>
      </form>
    </div>
  );
}