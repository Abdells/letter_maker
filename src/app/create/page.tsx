'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Template {
  _id: string;
  type: string;
  title: string;
}

export default function CreatePage() {
  const [profession, setProfession] = useState('');
  const [letterType, setLetterType] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!profession) {
      setTemplates([]);
      setLetterType('');
      setError('');
      return;
    }

    setLoading(true);
    setError('');
    setLetterType('');

    fetch(`/api/templates?category=${profession}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setTemplates(data);
        } else {
          setTemplates([]);
          setError('Invalid response from server');
        }
      })
      .catch(err => {
        console.error(err);
        setTemplates([]);
        setError('Failed to load letter types');
      })
      .finally(() => setLoading(false));
  }, [profession]);

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '3rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
          Create New Letter
        </h1>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Profession</label>
          <select
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px', fontSize: '1.1rem' }}
          >
            <option value="">Select profession...</option>
            <option value="teachers">Teachers</option>
            <option value="nurses">Nurses</option>
            {/* Add more professions here */}
          </select>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Letter Type</label>
          <select
            value={letterType}
            onChange={(e) => setLetterType(e.target.value)}
            disabled={loading || !profession || templates.length === 0}
            style={{
              width: '100%',
              padding: '0.8rem',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '1.1rem',
              background: loading || !profession ? '#f0f0f0' : 'white',
            }}
          >
            <option value="">
              {loading ? 'Loading...' : !profession ? 'Select profession first' : templates.length === 0 ? 'No types available' : 'Choose letter type...'}
            </option>
            {templates.map(t => (
              <option key={t._id} value={t.type}>
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

        {letterType && (
          <Link href={`/create/${letterType}`}>
            <button
              style={{
                width: '100%',
                padding: '1rem',
                background: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1.2rem',
                cursor: 'pointer',
              }}
            >
              Continue to Fill Details
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
