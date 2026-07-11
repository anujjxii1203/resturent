'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function PaymentStatusContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transactionId');

  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'not_found'>('loading');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!transactionId) {
      setStatus('not_found');
      return;
    }

    let intervalId: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/orders/status?transactionId=${transactionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOrderDetails(data);
            
            if (data.status !== 'pending_payment') {
              setStatus('success');
              clearInterval(intervalId);
              return;
            }
          }
        }
        
        // Timeout check: 40 retries * 3 seconds = 120 seconds (2 mins)
        if (retryCount >= 40) {
          setStatus('failed');
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
      setRetryCount(prev => prev + 1);
    };

    // Run first check
    checkStatus();

    // Set polling interval
    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [transactionId, retryCount]);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'var(--bg-light)'
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid var(--border-green)',
    borderRadius: '20px',
    padding: '3rem 2.5rem',
    maxWidth: '500px',
    width: '100%',
    textAlign: 'center',
    boxShadow: 'var(--shadow-luxury)'
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-heading)',
    fontSize: '2rem',
    color: 'var(--text-dark)',
    marginBottom: '0.5rem',
    fontWeight: 600
  };

  const textStyle: React.CSSProperties = {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginBottom: '2rem'
  };

  const infoBoxStyle: React.CSSProperties = {
    background: 'rgba(143, 168, 130, 0.05)',
    border: '1px solid var(--border-green)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    textAlign: 'left'
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(143, 168, 130, 0.1)',
    fontSize: '0.9rem'
  };

  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    background: 'var(--primary-orange)',
    color: '#ffffff',
    textDecoration: 'none',
    padding: '1rem',
    borderRadius: '30px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontSize: '0.85rem',
    boxShadow: '0 4px 14px rgba(231, 150, 86, 0.25)',
    marginBottom: '1rem'
  };

  // View state helpers
  if (status === 'not_found') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle} className="animate-fade-in">
          <h2 style={titleStyle}>Invalid Request</h2>
          <p style={textStyle}>No transaction reference found. Please checkout your cart again.</p>
          <Link href="/" style={btnStyle}>
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto 2rem auto' }}>
             <div style={{ position: 'absolute', inset: 0, border: '4px solid var(--primary-orange)', borderRadius: '50%', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={titleStyle}>Verifying Payment</h2>
          <p style={{...textStyle, color: 'var(--primary-orange)', fontWeight: 600}}>Contacting PhonePe Gateway...</p>
          <div style={infoBoxStyle}>
            <div style={rowStyle}><span style={{color: 'var(--text-muted)'}}>TXN Ref:</span> <span style={{fontWeight: 600}}>{transactionId}</span></div>
            <div style={{...rowStyle, borderBottom: 'none'}}><span style={{color: 'var(--text-muted)'}}>Verification Retries:</span> <span style={{fontWeight: 600}}>{retryCount} / 40</span></div>
          </div>
          <p style={{fontSize: '0.8rem', color: '#a09085'}}>
            Please do not hit refresh, go back, or close this tab. Once PhonePe confirms the payment, this page will update automatically.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={containerStyle}>
        <div style={cardStyle} className="animate-slide-up">
          <div style={{ width: '70px', height: '70px', background: 'var(--primary-green)', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 8px 20px rgba(143, 168, 130, 0.4)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h2 style={titleStyle}>Order Confirmed!</h2>
          <p style={textStyle}>Payment received and verified successfully via PhonePe.</p>
          
          <div style={infoBoxStyle}>
            <div style={rowStyle}>
              <span style={{color: 'var(--text-muted)'}}>Order ID:</span>
              <span style={{fontWeight: 600}}>#{orderDetails?.orderId}</span>
            </div>
            <div style={rowStyle}>
              <span style={{color: 'var(--text-muted)'}}>Customer:</span>
              <span style={{fontWeight: 600}}>{orderDetails?.customerName}</span>
            </div>
            <div style={{...rowStyle, borderBottom: 'none'}}>
              <span style={{color: 'var(--text-muted)'}}>Amount Paid:</span>
              <span style={{fontWeight: 700, color: 'var(--primary-orange)'}}>₹{orderDetails?.amount?.toFixed(2)}</span>
            </div>
          </div>

          <div style={{...infoBoxStyle, background: 'rgba(37, 211, 102, 0.05)', borderColor: 'rgba(37, 211, 102, 0.2)', padding: '1rem', display: 'flex', gap: '0.8rem', alignItems: 'flex-start'}}>
            <span style={{fontSize: '1.2rem', marginTop: '2px'}}>💬</span>
            <p style={{fontSize: '0.85rem', color: 'var(--text-dark)', margin: 0, textAlign: 'left', lineHeight: 1.5}}>
              We have sent a confirmation message on your WhatsApp number. Your rider will be assigned automatically.
            </p>
          </div>

          <Link href="/" style={btnStyle}>
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Failed / Timeout state
  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ width: '70px', height: '70px', background: '#d32f2f', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        <h2 style={titleStyle}>Verification Pending</h2>
        <p style={textStyle}>
          The payment gateway callback is taking longer than expected.
        </p>

        <div style={{...infoBoxStyle, background: '#fff9e6', borderColor: '#ffdf80'}}>
          <p style={{fontSize: '0.85rem', color: '#8c6b00', margin: 0}}>
            ⚠️ If you have completed the payment and money was deducted from your account, <strong>your order is safe</strong>! Our system will process the payment background callback or our team will verify it manually.
          </p>
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <a
            href={`https://wa.me/917303059402?text=${encodeURIComponent(`Hi, I paid for Order at Swaad Rustam (TXN Ref: ${transactionId}). Please verify my payment!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{...btnStyle, background: '#25D366', boxShadow: '0 4px 14px rgba(37, 211, 102, 0.25)'}}
          >
            💬 Contact Support on WhatsApp
          </a>
          <Link href="/" style={{...btnStyle, background: 'transparent', color: 'var(--text-dark)', border: '1.5px solid var(--border-green)', boxShadow: 'none'}}>
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

