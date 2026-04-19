'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

type FormState = {
  category: string;
  type: string;
  title: string;
  content: string;
  placeholders: string;
};

export default function EditTemplate() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>({
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
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load template - ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setForm({
          category: data.category || '',
          type: data.type || '',
          title: data.title || '',
          content: data.content || '',
          placeholders: data.placeholders ? data.placeholders.join(', ') : ''
        });
      })
      .catch((err: unknown) => {
        console.error('Edit fetch error:', err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Failed to load template');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...form,
          placeholders: form.placeholders.split(',').map((p) => p.trim())
        })
      });

      if (!res.ok) throw new Error('Update failed');

      router.push('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert('Update failed: ' + err.message);
      } else {
        alert('Update failed');
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading template...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: 'auto' }}>
      <h1>Edit Template</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Category"
          value={form.category}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, category: e.target.value })
          }
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />

        <input
          placeholder="Type"
          value={form.type}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, type: e.target.value })
          }
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />

        <input
          placeholder="Title"
          value={form.title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, title: e.target.value })
          }
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />

        <textarea
          placeholder="Content"
          value={form.content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setForm({ ...form, content: e.target.value })
          }
          rows={15}
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
          required
        />

        <input
          placeholder="Placeholders"
          value={form.placeholders}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm({ ...form, placeholders: e.target.value })
          }
          style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
        />

        <button
          type="submit"
          style={{
            padding: '1rem 2rem',
            background: '#0d6efd',
            color: 'white',
            border: 'none'
          }}
        >
          Update Template
        </button>
      </form>
    </div>
  );
}