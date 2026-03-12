'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { saveAs } from 'file-saver';
import { PaystackButton } from 'react-paystack';

export default function PreviewPage() {
  const { type } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [blocks, setBlocks] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(true);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const getFullLetterText = () => {
  if (!blocks) return '';

  const {
    writer = [],
    receiver = [],
    date = '',
    title = '',
    salutation = '',
    paragraphs = [],
    closing = '',
    signature = []
  } = blocks;

  return [
    writer.join('\n'),
    date,
    receiver.join('\n'),
    salutation,
    title ? title.toUpperCase() : '',
    paragraphs.join('\n\n'),
    closing,
    signature.join('\n')
  ]
    .filter(section => section && section.trim() !== '')
    .join('\n\n');
};

  useEffect(() => {
    const dataParam = searchParams.get('data');

    if (!dataParam || !type) {
      setError('Missing form data or letter type');
      setLoading(false);
      return;
    }

    let parsedData;
    try {
      parsedData = JSON.parse(decodeURIComponent(dataParam));
    } catch {
      setError('Invalid form data');
      setLoading(false);
      return;
    }
    // Save form data to localStorage for Edit Text pre-fill (right here!)
    if (parsedData) {
    localStorage.setItem('letterFormData', JSON.stringify(parsedData));
    }

    fetch(`/api/templates?type=${type}`)
      .then(res => {
        console.log('Fetch status:', res.status); // Debug log
        if (!res.ok) {
          return res.text().then(text => {
            console.log('Error response body:', text); // Debug log
            throw new Error(`Template fetch failed - ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        console.log('API returned data:', data); // Debug log

        let templateContent = '';
        // Handle all common API shapes
        if (Array.isArray(data) && data[0]?.content) {
          templateContent = data[0].content;
        } else if (data?.data && Array.isArray(data.data) && data.data[0]?.content) {
          templateContent = data.data[0].content;
        } else if (data?.template?.content) {
          templateContent = data.template.content;
        } else if (data?.content) {
          templateContent = data.content;
        }

        if (!templateContent) {
          throw new Error('Template content missing');
        }

        // Replace placeholders
        Object.entries(parsedData).forEach(([key, value]) => {
          templateContent = templateContent.replace(
            new RegExp(`{{${key}}}`, 'g'),
            value || ''
          );
        });

        setBlocks(parseLetter(templateContent));
      })
      .catch(err => {
        console.error('Preview error:', err.message);
        setError(err.message || 'Unable to load letter template');
      })
      .finally(() => setLoading(false));
  }, [type, searchParams]);

  // Add this NEW useEffect SEPARATELY (right after the main one)
useEffect(() => {
  fetch('/api/admin/settings')
    .then(res => res.json())
    .then(data => setPaymentRequired(data.enabled))
    .catch(() => setPaymentRequired(true)); // default ON
}, []);

  if (loading) {
    return <div style={{ padding: '6rem', textAlign: 'center' }}>Generating preview…</div>;
  }

  if (error) {
    return <div style={{ padding: '6rem', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  const {
    writer,
    receiver,
    date,
    title,
    salutation,
    paragraphs,
    closing,
    signature
  } = blocks || {};

  // Visible preview: addresses → date → salutation → title → first paragraph only
  const visibleContent = [
    ...writer,
    date ? date : '',
    ...receiver,
    salutation || '',
    title ? title.toUpperCase() : '',
    paragraphs[0] ? paragraphs[0].substring(0, 250) + '...' : ''  // First paragraph, truncated
  ].filter(Boolean).join('\n');

  const handleActionClick = () => {
    setShowPaymentModal(true);
  };
    {/*FUNCTION TO MAKE DOWNLOAD POSSIBLE=====START*/}
  const handleDownload = async (format = 'pdf') => {
  try {
    // Guard: make sure blocks exist
    if (!blocks || Object.keys(blocks).length === 0) {
      console.log('Blocks not ready:', blocks); // Debug
      alert('Letter not fully loaded yet. Please wait a moment and try again.');
      return;
    }

    console.log('Sending blocks to download API:', blocks); // Debug: check browser console

    const response = await fetch('/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks,   // This is the structured data
        format
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errText}`);
    }

    const blob = await response.blob();
    //if (blob.size === 0) throw new Error('Empty file received');

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title || 'letter'}.${format}`;  // uses the letter title if present
    link.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download error:', err);
    alert('Download failed: ' + err.message);
  }
};
  {/*========END OF DOWNLOAD FUNCTION===========*/}

  return (
    <div
  style={{
    minHeight: '100vh',
    background: '#f8f9fa',
    padding: '2rem 1rem',
    overflowX: 'auto', // allows scroll instead of squish
  }}
>  
  <div
  className="letter-paper"
  style={{
    width: '794px',
    minHeight: '1123px',
    margin: '0 auto',
    background: '#fff',
    padding: '2.54cm 1.27cm',
    borderRadius: 12,
    boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
    position: 'relative',
    flexShrink: 0,
  }}
>
  
        {/* Writer's address - top right */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
        }}>
          <div style={{
            textAlign: 'left',
            maxWidth: '45%',
            minWidth: '220px',
          }}>
            {writer.map((l, i) => (
              <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
            ))}
            {date && <div style={{ marginTop: '1rem' }}>{date}</div>}
          </div>
        </div>

        {/* Receiver's address - top left */}
        <div style={{
          textAlign: 'left',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
        }}>
          {receiver.map((l, i) => (
            <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
          ))}
        </div>

        {/* Salutation */}
        {salutation && (
          <p style={{ marginBottom: '1.5rem' }}>
            {salutation}
          </p>
        )}

        {/* Title / Subject */}
        {title && (
          <p style={{
            marginBottom: '2rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
            letterSpacing: '0.5px',
            textAlign: 'center'
          }}>
            {title}
          </p>
        )}

        {/* Visible body - first paragraph only */}
        <div>
          <p style={{ marginBottom: '1.4rem' }}>
            {visibleContent.split('\n').pop() || 'First paragraph preview...'}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

  {/* Read Full Letter */}
  <button onClick={() => {
  if (paymentRequired && !isPaid) {
    setShowPaymentModal(true);
  } else {
    setShowFullPreview(true);
  }
}} style={btnBlue}>
  Read Full Letter
</button>

<button onClick={() => router.back()} style={btnGrey}>
  Edit Text
</button>

<button onClick={() => {
  if (paymentRequired && !isPaid) {
    setShowPaymentModal(true);
  } else {
    handleDownload('pdf');
  }
}} style={btnBlue}>
  Download PDF
</button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
    <div style={{ background: 'white', padding: '2.5rem', borderRadius: 12, maxWidth: 420, textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.6rem' }}>Unlock Full Letter</h2>
      <p style={{ marginBottom: '2rem', color: '#555', fontSize: '1.1rem' }}>
        Pay: <strong>GHS 10.00</strong><br />
        Get full preview + PDF / Word download
      </p>

      <PaystackButton
        publicKey="pk_live_90f90508a4cdfae1a313791a800ed3ee2a5ebf2c" // 
        email="user@example.com" // ← can be dynamic later
        amount={1000} // GHS 10 = 1000 kobo
        currency="GHS"
        reference={new Date().getTime().toString()}
        onSuccess={(response) => {
          console.log('Payment successful', response);
          setIsPaid(true);
          setShowPaymentModal(false);
          alert('Payment successful! You can now download the full letter.');
        }}
        onClose={() => {
          alert('Payment cancelled.');
        }}
        text="Unlock (GHS 10.00)"
        style={{
          padding: '1rem 2.5rem',
          background: '#0d6efd',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: '1.1rem',
          cursor: 'pointer',
          marginRight: '1rem'
        }}
      />

      <button
        onClick={() => setShowPaymentModal(false)}
        style={{
          padding: '1rem 2rem',
          background: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          fontSize: '1.1rem',
          cursor: 'pointer'
        }}
      >
        Cancel
      </button>
    </div>
  </div>
)}
      {/*FULL PREVIEW LETTER WHEN PAYMENT IS DISABLED OR AFTER PAYMENT*/}
      {showFullPreview && (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'flex-start',          
    justifyContent: 'center',
    zIndex: 2000,
    overflow: 'auto',                  
    paddingTop: '1rem',                
  }}>
    <div style={{
      background: '#fff',
      padding: '2.54cm 1.27cm',        
      maxWidth: '21cm',                
      width: '90%',
      minHeight: '29.7cm',             
      maxHeight: '90vh',               
      overflowY: 'auto',               
      borderRadius: 8,
      boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      position: 'relative',
      fontFamily: 'Georgia, serif',
      fontSize: '1.1rem',
      lineHeight: 1.8,
      whiteSpace: 'pre-wrap',
      boxSizing: 'border-box',
    }}>
      {/* Writer's address - top right */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
        }}>
          <div style={{
            textAlign: 'left',
            maxWidth: '45%',
            minWidth: '220px',
          }}>
            {writer.map((l, i) => (
              <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
            ))}
            {date && <div style={{ marginTop: '1rem' }}>{date}</div>}
          </div>
        </div>

        {/* Receiver's address - top left */}
        <div style={{
          textAlign: 'left',
          marginBottom: '2.5rem',
          fontSize: '1.1rem',
        }}>
          {receiver.map((l, i) => (
            <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
          ))}
        </div>

        {/* Salutation */}
        {salutation && (
          <p style={{ marginBottom: '1.5rem' }}>
            {salutation}
          </p>
        )}

        {/* Title / Subject */}
        {title && (
          <p style={{
            marginBottom: '2rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            textDecoration: 'underline',
            textUnderlineOffset: '6px',
            letterSpacing: '0.5px',
            textAlign: 'center'
          }}>
            {title}
          </p>
        )}
      {/* Full Body */}
      {paragraphs.map((p, i) => (
        <p key={i} style={{ marginBottom: '1.4rem' }}>{p}</p>
      ))}

     {/* Closing + Signature Block */}
{closing && (
  <div
    style={{
      marginTop: '2rem',
      display: 'flex',
      justifyContent: 'flex-end'
    }}
  >
    <div
      style={{
        textAlign: 'left',
        maxWidth: '45%',
        minWidth: '220px'
      }}
    >
      <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>
        {closing}
      </p>

      {signature?.length > 0 &&
        signature.map((l, i) => (
          <div key={i} style={{ marginBottom: '0.3rem' }}>
            {l}
          </div>
        ))}
    </div>
  </div>
)}

      {/* Close Button */}
      <button
        onClick={() => setShowFullPreview(false)}
        style={{
          position: 'fixed',           
          top: '1rem',
          right: '1rem',
          padding: '0.5rem 1rem',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          zIndex: 3000
        }}
      >
        Close Full View
      </button>
    </div>
  </div>
)}

      {/* ================= PRINT STYLES ================= */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .letter-paper {
            width: 100% !important;        /* Fill page width */
            max-width: 210mm !important;   /* A4 width */
            min-height: 297mm !important;  /* A4 height */
            margin: 0 auto !important;     /* Center on page */
            box-shadow: none !important;   /* Remove shadow */
            border-radius: 0 !important;   /* Remove rounded corners */
            padding: 2.54cm 1.27cm !important; /* Standard A4 margins */
          }
        }
      `}</style>
  </div>
);
}

/* ========================= LETTER PARSER ========================= */

function parseLetter(content) {
  const lines = content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const blocks = {
    writer: [],
    receiver: [],
    date: '',
    title: '',
    salutation: '',
    paragraphs: [],
    closing: '',
    signature: []
  };

  let stage = 'writer';

  for (const line of lines) {
    if (!blocks.date && /\d{4}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(line)) {
      blocks.date = line;
      stage = 'receiver';
      continue;
    }

    if (/^dear/i.test(line)) {
      blocks.salutation = line;
      stage = 'body';
      continue;
    }

    const cleanedLine = line.trim();
const upperLine = cleanedLine.toUpperCase();

const titleStarters = [
  'APPLICATION',
  'REQUEST',
  'APPEAL',
  'COMPLAINT',
  'REPORT',
  'PETITION',
  'PROPOSAL',
  'NOTICE',
  'RE:',
  'REQUEST FOR',
  'APPLICATION FOR'
];

if (
  blocks.salutation &&
  !blocks.title &&
  cleanedLine &&
  (
    upperLine === cleanedLine ||
    titleStarters.some(word => upperLine.startsWith(word))
  )
) {
  blocks.title = cleanedLine;
  continue;
}

    if (/^(yours|sincerely|faithfully|best regards|regards)/i.test(line)) {
      blocks.closing = line;
      stage = 'signature';
      continue;
    }

    if (stage === 'writer') {
      blocks.writer.push(line);
      continue;
    }

    if (stage === 'receiver') {
      blocks.receiver.push(line);
      continue;
    }

    if (stage === 'signature') {
      blocks.signature.push(line);
      continue;
    }

    if (stage === 'body') {
      blocks.paragraphs.push(line);
    }
  }

  return blocks;
}

/* ========================= STYLES ========================= */

const btnGrey = {
  padding: '0.9rem 2rem',
  background: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  margin: '0 0.5rem',
  cursor: 'pointer'
};

const btnBlue = {
  padding: '0.9rem 2rem',
  background: '#0d6efd',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  margin: '0 0.5rem',
  cursor: 'pointer'
};