'use client';

import { useEffect, useState } from 'react';

interface Template {
  _id: string;
  title: string;
  category: string;
  type: string;
}

export default function AdminDashboard() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [paymentRequired, setPaymentRequired] = useState(true);

  // Load templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/admin/templates');
        if (!res.ok) throw new Error('Failed to load templates');
        const data = await res.json();
        setTemplates(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Load current payment setting
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setPaymentRequired(data.enabled))
      .catch(() => setPaymentRequired(true)); // default ON
  }, []);

  const deleteTemplate = async (id: string) => {
    if (!confirm('Delete this template permanently?')) return;

    try {
      const res = await fetch(`/api/admin/templates?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      const updated = await fetch('/api/admin/templates');
      setTemplates(await updated.json());
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Save toggle change to backend
  const togglePayment = async (newValue: boolean) => {
    setPaymentRequired(newValue);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newValue })
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch (err: any) {
      alert('Failed to save setting. Reverting...');
      setPaymentRequired(!newValue); // revert on error
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div style={{ padding: '4rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('templates')}
          style={{
            padding: '0.8rem 1.5rem',
            background: activeTab === 'templates' ? '#0d6efd' : '#e9ecef',
            color: activeTab === 'templates' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'templates' ? 'bold' : 'normal'
          }}
        >
          Templates
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            padding: '0.8rem 1.5rem',
            background: activeTab === 'settings' ? '#0d6efd' : '#e9ecef',
            color: activeTab === 'settings' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'settings' ? 'bold' : 'normal'
          }}
        >
          Settings
        </button>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div>
          <a href="/admin/new" style={{ display: 'inline-block', marginBottom: '2rem' }}>
            <button style={{
              padding: '0.8rem 1.5rem',
              background: '#0d6efd',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Add New Template
            </button>
          </a>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #ddd', padding: '1rem' }}>Title</th>
                <th style={{ border: '1px solid #ddd', padding: '1rem' }}>Category</th>
                <th style={{ border: '1px solid #ddd', padding: '1rem' }}>Type</th>
                <th style={{ border: '1px solid #ddd', padding: '1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map(t => (
                <tr key={t._id}>
                  <td style={{ border: '1px solid #ddd', padding: '1rem' }}>{t.title}</td>
                  <td style={{ border: '1px solid #ddd', padding: '1rem' }}>{t.category}</td>
                  <td style={{ border: '1px solid #ddd', padding: '1rem' }}>{t.type}</td>
                  <td style={{ border: '1px solid #ddd', padding: '1rem' }}>
                    <a href={`/admin/${t._id}`} style={{ color: '#0d6efd', marginRight: '1rem' }}>
                      Edit
                    </a>
                    <button
                      onClick={() => deleteTemplate(t._id)}
                      style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{ padding: '2rem', background: '#f8f9fa', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Settings</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label style={{ fontSize: '1.2rem', fontWeight: 500 }}>
              Payment Required
            </label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={paymentRequired}
                onChange={(e) => togglePayment(e.target.checked)}
                style={{ width: '1.4rem', height: '1.4rem' }}
              />
              {paymentRequired ? 'ON (users must pay)' : 'OFF (free access)'}
            </label>
          </div>

          <p style={{ marginTop: '1rem', color: '#666' }}>
            When OFF, all users can access full letters and downloads without payment.
          </p>
        </div>
      )}
    </div>
  );
}
