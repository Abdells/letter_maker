'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';


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
  const [letterPrice, setLetterPrice] = useState(10);
  const [pendingAction, setPendingAction] = useState(null);

  // ================= PAYSTACK SETUP =================
  // Load Paystack inline script once on mount
  useEffect(() => {
    if (document.getElementById('paystack-script')) return; 
    const script = document.createElement('script');
    script.id = 'paystack-script';
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // This call directly paystack inline popup
  const openPaystack = (action: 'read' | 'download') => {
    setPendingAction(action);
    setShowPaymentModal(false); 

    const handler = (window as any).PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_your_test_key_here',
      email: 'user@nomail.com',
      amount: letterPrice * 100, // GHS to pesewas
      currency: 'GHS',
      ref: `ref_${Date.now()}`, // fresh unique ref each time
      onClose: () => {
        console.log('Paystack popup closed without payment');
        setPendingAction(null);
      },
      callback: (response) => {
        // Paystack calls this AND closes its own popup automatically
        console.log('Payment successful:', response.reference);
        setIsPaid(true);
        // Execute the intended action
        setTimeout(() => {
          if (action === 'download') {
            handleDownload('pdf');
          } else if (action === 'read') {
            setShowFullPreview(true);
          }
          setPendingAction(null);
        }, 300);
      },
    });

    handler.openIframe();
  };
  // ================================================

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

    if (parsedData) {
      localStorage.setItem('letterFormData', JSON.stringify(parsedData));
    }

    fetch(`/api/templates?type=${type}`)
      .then(res => {
        if (!res.ok) {
          return res.text().then(text => {
            throw new Error(`Template fetch failed - ${res.status} - ${text}`);
          });
        }
        return res.json();
      })
      .then(data => {
        let templateContent = '';
        if (Array.isArray(data) && data[0]?.content) {
          templateContent = data[0].content;
        } else if (data?.data && Array.isArray(data.data) && data.data[0]?.content) {
          templateContent = data.data[0].content;
        } else if (data?.template?.content) {
          templateContent = data.template.content;
        } else if (data?.content) {
          templateContent = data.content;
        }

        if (!templateContent) throw new Error('Template content missing');

        Object.entries(parsedData).forEach(([key, value]) => {
          templateContent = templateContent.replace(
            new RegExp(`{{${key}}}`, 'g'),
            String(value || '')
          );
        });

        setBlocks(parseLetter(templateContent));
      })
      .catch(err => {
        setError(err.message || 'Unable to load letter template');
      })
      .finally(() => setLoading(false));
  }, [type, searchParams]);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => setPaymentRequired(data.enabled))
      .catch(() => setPaymentRequired(true));
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

  const visibleContent = [
    ...writer,
    date ? date : '',
    ...receiver,
    salutation || '',
    title ? title.toUpperCase() : '',
    paragraphs[0] ? paragraphs[0].substring(0, 250) + '...' : ''
  ].filter(Boolean).join('\n');
  
  //The download logic
  const handleDownload = async (format = 'pdf') => {
    try {
      if (!blocks || Object.keys(blocks).length === 0) {
        alert('Letter not fully loaded yet. Please wait a moment and try again.');
        return;
      }

      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks, format })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${response.status}`);
      }

      // Read as JSON (base64 string) 
      const { base64, error: apiError } = await response.json();

      if (apiError) throw new Error(apiError);
      if (!base64) throw new Error('No PDF data received from server');

      //  Convert base64  binary back to Blob  in the browser
      const byteCharacters = atob(base64);
      const byteNumbers = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteNumbers], { type: 'application/pdf' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'letter'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed: ' + err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8f9fa',
        padding: '2rem 1rem',
        overflowX: 'auto',
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
          <p style={{ marginBottom: '1.5rem' }}>{salutation}</p>
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
        <div style={{
          textAlign: 'center',
          marginTop: '3rem',
          display: 'flex',
          justifyContent: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>

          <button
            onClick={() => {
              if (paymentRequired && !isPaid) {
                setShowPaymentModal(true);
                setPendingAction('read');
              } else {
                setShowFullPreview(true);
              }
            }}
            style={btnBlue}
          >
            Read Full Letter
          </button>

          <button onClick={() => router.back()} style={btnGrey}>
            Edit Text
          </button>

          <button
            onClick={() => {
              if (paymentRequired && !isPaid) {
                setShowPaymentModal(true);
                setPendingAction('download');
              } else {
                handleDownload('pdf');
              }
            }}
            style={btnBlue}
          >
            Download PDF
          </button>

        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem',
            borderRadius: 12,
            maxWidth: 420,
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.6rem' }}>
              Unlock Full Letter
            </h2>
            <p style={{ marginBottom: '2rem', color: '#555', fontSize: '1.1rem' }}>
              One-time payment: <strong>GHS {letterPrice.toFixed(2)}</strong><br />
              Get full preview + PDF / Word download
            </p>

            <button
              onClick={() => openPaystack(pendingAction as 'read' | 'download')}
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
            >
              Pay Now (GHS {letterPrice.toFixed(2)})
            </button>

            <button
              onClick={() => {
                setShowPaymentModal(false);
                setPendingAction(null);
              }}
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

      {/* Full Preview Modal */}
      {showFullPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 2000,
          overflow: 'auto',
          paddingTop: '1rem',
          paddingBottom: '1rem',
        }}>
          <div style={{
            overflowX: 'auto',
            
          }}>
          <div style={{
            background: '#fff',
            padding: '2.54cm 1.27cm',
            width: '794px',
            minWidth: '794px',
            minHeight: '29.7cm',
            borderRadius: 8,
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            position: 'relative',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: '1.1rem',
            lineHeight: 1.8,
            boxSizing: 'border-box',
            flexShrink: 0,
          }}>

            {/* Writer's address */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginBottom: '2.5rem',
              fontSize: '1.1rem',
            }}>
              <div style={{ textAlign: 'left', maxWidth: '45%', minWidth: '220px' }}>
                {writer.map((l, i) => (
                  <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
                ))}
                {date && <div style={{ marginTop: '1rem' }}>{date}</div>}
              </div>
            </div>

            {/* Receiver */}
            <div style={{ textAlign: 'left', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
              {receiver.map((l, i) => (
                <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
              ))}
            </div>

            {salutation && <p style={{ marginBottom: '1.5rem' }}>{salutation}</p>}

            {title && (
              <p style={{
                marginBottom: '2rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                textDecoration: 'underline',
                textUnderlineOffset: '6px',
                letterSpacing: '0.5px',
                textAlign: 'center',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}>
                {title}
              </p>
            )}

            {paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: '1.4rem' }}>{p}</p>
            ))}

            {closing && (
              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ textAlign: 'left', maxWidth: '45%', minWidth: '220px' }}>
                  <p style={{ marginBottom: '0', fontWeight: 500 }}>{closing}</p>
                  <div style={{ height: '1.4rem' }} />
                  <div style={{
                    borderBottom: '1px dotted #000',
                    width: 'fit-content',
                    marginBottom: '0.3rem',
                  }}>
                    <span style={{ visibility: 'hidden', fontSize: '1.1rem', whiteSpace: 'nowrap' }}>
                      {signature?.length > 0
                        ? signature.reduce((a, b) => a.length >= b.length ? a : b, '')
                        : 'Signature'}
                    </span>
                  </div>
                  {signature?.length > 0 && signature.map((l, i) => (
                    <div key={i} style={{ marginBottom: '0.3rem' }}>{l}</div>
                  ))}
                </div>
              </div>
            )}

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
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .letter-paper {
            width: 100% !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 2.54cm 1.27cm !important;
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
      (upperLine === cleanedLine || titleStarters.some(word => upperLine.startsWith(word)))
    ) {
      blocks.title = cleanedLine;
      continue;
    }

    if (/^(yours|sincerely|faithfully|best regards|regards)/i.test(line)) {
      blocks.closing = line;
      stage = 'signature';
      continue;
    }

    if (stage === 'writer') { blocks.writer.push(line); continue; }
    if (stage === 'receiver') { blocks.receiver.push(line); continue; }
    if (stage === 'signature') { blocks.signature.push(line); continue; }
    if (stage === 'body') { blocks.paragraphs.push(line); }
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
