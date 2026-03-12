'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function FillDetailsPage() {
  const { type } = useParams();
  const [template, setTemplate] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  

  useEffect(() => {
  if (!type) return;

  setLoading(true);
  setError('');

  // First: try to load saved data from localStorage
  const savedData = localStorage.getItem('letterFormData');
  let initialSaved = {};
  if (savedData) {
    try {
      initialSaved = JSON.parse(savedData);
    } catch (e) {
      console.error('Invalid saved data', e);
    }
  }

  fetch(`/api/templates?type=${type}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      console.log('Fetched template for type', type, ':', data);
      if (Array.isArray(data) && data.length > 0) {
        const tmpl = data[0];
        setTemplate(tmpl);

        // Create initial empty object for placeholders
        const initial = {};
        tmpl.placeholders.forEach(p => initial[p] = '');

        // Merge saved data (only fill fields that exist in this template)
        const merged = { ...initial, ...initialSaved };

        setFormData(merged);
      } else {
        setError('No template found for this type');
      }
    })
    .catch(err => {
      console.error('Fetch error:', err);
      setError('Failed to load template');
    })
    .finally(() => setLoading(false));
}, [type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);

    const params = new URLSearchParams();
    params.append('data', encodeURIComponent(JSON.stringify(formData)));

    const previewUrl = `/preview/${type}?${params.toString()}`;
    console.log('Redirecting to:', previewUrl);

    window.location.href = previewUrl;
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading template...</div>;

  if (error) return <div style={{ textAlign: 'center', padding: '4rem', color: 'red' }}>{error}</div>;

  if (!template) return <div style={{ textAlign: 'center', padding: '4rem' }}>Template not found</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '2rem' }}>
          {template.title}
        </h1>

        <form onSubmit={handleSubmit}>
          {template.placeholders.map(field => (
            <div key={field} style={{ marginBottom: '1.5rem' }}>
              <label 
                htmlFor={field}
                style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}
              >
                {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </label>
              <input
                type="text"
                id={field}
                name={field}
                value={formData[field] || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                }}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '1rem',
              background: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1.2rem',
              cursor: 'pointer',
              marginTop: '1.5rem',
            }}
          >
            Generate Preview
          </button>
        </form>
      </div>
    </div>
  );
}