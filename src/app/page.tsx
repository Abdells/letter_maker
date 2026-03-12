'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ padding: '3rem 2rem', background: 'linear-gradient(to bottom, #eff6ff, #ffffff)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3.0rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Create Professional Letters in Minutes
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#4b5563', marginBottom: '2.5rem' }}>
            BlueOnion helps teachers, nurses, accountants and other professionals in Ghana generate official letters quickly — correctly formatted, professional, and ready to print or email.
          </p>
          <Link href="/create">
            <button style={{
              padding: '1rem 2.5rem',
              fontSize: '1.3rem',
              background: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              Create a Letter Now
            </button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '2rem 2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Fast & Simple</h3>
            <p>Select type, fill details, get ready letter in seconds.</p>
          </div>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Ghana-Standard Formats</h3>
            <p>Templates based on real official letters used in schools, hospitals, offices.</p>
          </div>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Pay Only When Ready</h3>
            <p>Preview free — pay to download full PDF or Word.</p>
          </div>
        </div>
      </section>
    </div>
  );
}