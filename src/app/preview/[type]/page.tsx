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

  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      const screenWidth = window.innerWidth;
      const padding = 16; // 1rem on each side
      const available = screenWidth - padding * 2;
      const newScale = Math.min(1, available / 794);
      setScale(newScale);
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);
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
    through,
    date,
    title,
    titles,
    salutation,
    paragraphs,
    closing,
    signature,
    cc
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
        background: '#ffffff',
        padding: '1rem 0 2rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Scale wrapper - only wraps the letter paper */}
      <div style={{
        width: `${794 * scale}px`,
        height: `${1123 * scale}px`,
        position: 'relative',
        flexShrink: 0,
      }}>
        <div
          className="letter-paper"
          style={{
            width: '794px',
            minHeight: '1123px',
            background: '#fff',
            padding: '2.54cm 1.27cm',
            borderRadius: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            position: 'absolute',
            top: 0,
            left: 0,
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
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

        {/* Through block - left aligned, below receiver */}
        {through && through.length > 0 && (
          <div style={{
            textAlign: 'left',
            marginBottom: '2.5rem',
            fontSize: '1.1rem',
          }}>
            <div style={{ marginBottom: '0.4rem' }}>Thro&apos;</div>
            {through.map((l, i) => (
              <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
            ))}
          </div>
        )}

        {/* Salutation */}
        {salutation && (
          <p style={{ marginBottom: '1.5rem' }}>{salutation}</p>
        )}

        {/* Titles / Subject - stacked, all bold and underlined */}
        {titles && titles.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {titles.map((t, i) => (
              <p key={i} style={{
                marginBottom: '0.3rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                textDecoration: 'underline',
                textUnderlineOffset: '6px',
                letterSpacing: '0.5px',
                textAlign: 'center',
                overflowWrap: 'break-word',
                wordBreak: 'break-word',
              }}>
                {t}
              </p>
            ))}
          </div>
        )}

        {/* Visible body - first paragraph only */}
        <div>
          <p style={{ marginBottom: '1.4rem' }}>
            {visibleContent.split('\n').pop() || 'First paragraph preview...'}
          </p>
        </div>

        </div>
      </div>

      {/* Action Buttons - fixed bottom bar, always visible on all screens */}
      {/* <div style={{
        position: 'fixed',
        bottom: '1rem',
        left: 0,
        right: 0,
        background: 'white',
        borderTop: '1px solid #e9ecef',
        padding: '0.6rem 0.5rem calc(0.6rem + env(safe-area-inset-bottom)) 0.5rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'nowrap',
        zIndex: 100,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        borderRadius: '12px',
        margin: '0 2rem', */}

        {/* Action Buttons */}
        <div style={{
        width: '100%',
        position: 'sticky',
        bottom: 0,
        background: 'white',
        borderTop: '1px solid #e9ecef',
        padding: '0.8rem 0.5rem 2rem 0.5rem',
        display: 'flex',
        justifyContent: 'center',
        gap: '0.5rem',
        flexWrap: 'nowrap',
        zIndex: 100,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        marginTop: '1rem',
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

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div style={{
            background: 'white',
            padding: '2.5rem 2rem',
            borderRadius: 16,
            maxWidth: 420,
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          }}>
            
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a' }}>
              Your Letter is Ready
            </h2>
            <p style={{ marginBottom: '0.5rem', color: '#555', fontSize: '1rem', lineHeight: 1.6 }}>
              Unlock the full letter and download a professionally formatted PDF for:
            </p>
            <p style={{ marginBottom: '1.8rem', fontSize: '1.5rem', fontWeight: 800, color: '#0d6efd' }}>
              GHS {letterPrice.toFixed(2)}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <button
                onClick={() => openPaystack(pendingAction as 'read' | 'download')}
                style={{
                  padding: '1rem',
                  background: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Pay & Unlock — GHS {letterPrice.toFixed(2)}
              </button>

              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPendingAction(null);
                }}
                style={{
                  padding: '0.8rem',
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Not now
              </button>
            </div>

            <p style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: '#aaa' }}>
              Secure payment powered by Paystack
            </p>
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
          paddingBottom: '4rem',
        }}>
          {/* Outer centering wrapper */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            minHeight: '100%',
          }}>
            {/* Scale wrapper - sized to scaled dimensions so scroll works correctly */}
            <div style={{
              width: `${794 * scale}px`,
              flexShrink: 0,
              position: 'relative',
            }}>
              <div style={{
                background: '#fff',
                padding: '2.54cm 1.27cm',
                width: '794px',
                minHeight: '29.7cm',
                borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '1.1rem',
                lineHeight: 1.8,
                boxSizing: 'border-box',
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
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

            {/* Through block */}
            {through && through.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                <div style={{ marginBottom: '0.4rem' }}>Thro&apos;</div>
                {through.map((l, i) => (
                  <div key={i} style={{ marginBottom: '0.4rem' }}>{l}</div>
                ))}
              </div>
            )}

            {salutation && <p style={{ marginBottom: '1.5rem' }}>{salutation}</p>}

            {/* Stacked titles */}
            {titles && titles.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {titles.map((t, i) => (
                  <p key={i} style={{
                    marginBottom: '0.3rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    textDecoration: 'underline',
                    textUnderlineOffset: '6px',
                    letterSpacing: '0.5px',
                    textAlign: 'center',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}>
                    {t}
                  </p>
                ))}
              </div>
            )}

            {paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: '1.5rem' }}>{p}</p>
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

            {/* Cc block */}
            {cc && cc.length > 0 && (
              <div style={{ textAlign: 'left', marginTop: '2rem', fontSize: '1.1rem' }}>
                {cc.map((l, i) => (
                  <div key={i} style={{ marginBottom: '0.3rem' }}>{l}</div>
                ))}
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
    through: [],
    date: '',
    titles: [],
    title: '',
    salutation: '',
    paragraphs: [],
    closing: '',
    signature: [],
    cc: []
  };

  let stage = 'writer';
  let inThrough = false;

  for (const line of lines) {
    // Date detection
    if (!blocks.date && /\d{4}|January|February|March|April|May|June|July|August|September|October|November|December/i.test(line)) {
      blocks.date = line;
      stage = 'receiver';
      continue;
    }

    // Thro / Through detection
    if (/^(thro'?|through:?|thro:?)/i.test(line)) {
      inThrough = true;
      stage = 'through';
      continue;
    }

    // Salutation detection
    if (/^dear/i.test(line)) {
      blocks.salutation = line;
      inThrough = false;
      stage = 'body';
      continue;
    }

    // Cc detection - after signature
    if (/^(cc:|c\.c:|cc |carbon copy)/i.test(line)) {
      stage = 'cc';
      blocks.cc.push(line);
      continue;
    }

    const cleanedLine = line.trim();

    // Title detection - lines wrapped in **...**
    if (/^\*\*(.+)\*\*$/.test(cleanedLine)) {
      const titleText = cleanedLine.replace(/^\*\*|\*\*$/g, '').trim();
      blocks.titles.push(titleText);
      blocks.title = blocks.titles[0];
      continue;
    }

    // Closing detection
    if (/^(yours|sincerely|faithfully|best regards|regards)/i.test(line)) {
      blocks.closing = line;
      stage = 'signature';
      continue;
    }

    if (stage === 'writer') { blocks.writer.push(line); continue; }
    if (stage === 'receiver') { blocks.receiver.push(line); continue; }
    if (stage === 'through') { blocks.through.push(line); continue; }
    if (stage === 'signature') { blocks.signature.push(line); continue; }
    if (stage === 'cc') { blocks.cc.push(line); continue; }
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
