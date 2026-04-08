import React from 'react';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

function VerifyEmail() {
  const [status, setStatus] = React.useState('loading'); // loading, success, error
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const hash = window.location.hash; // e.g. #/verify-email/abc123
    const match = hash.match(/#\/verify-email\/(.+)/);
    if (!match) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const token = match[1];

    fetch(`${API_BASE}/auth/verify-email/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Network error. Please try again.');
      });
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card auth-card--verify">
        <div className="auth-card__accent"></div>

        {/* Logo */}
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">🔔</span>
          <div>
            <h1 className="auth-card__brand">SubSync</h1>
            <span className="auth-card__tagline">Subscription Detection System</span>
          </div>
        </div>

        {status === 'loading' && (
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--loading">⏳</div>
            <h2>Verifying your email...</h2>
            <p className="verify-status__text">Please wait while we verify your account.</p>
            <div className="verify-loader">
              <div className="verify-loader__bar"></div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--success">✅</div>
            <h2>Email Verified!</h2>
            <p className="verify-status__text">{message}</p>
            <a href="#/login" className="auth-btn" style={{ textDecoration: 'none', display: 'inline-flex', marginTop: '1.5rem' }}>
              🚀 Go to Login
            </a>
          </div>
        )}

        {status === 'error' && (
          <div className="verify-status">
            <div className="verify-status__icon verify-status__icon--error">❌</div>
            <h2>Verification Failed</h2>
            <p className="verify-status__text">{message}</p>
            <div className="verify-actions">
              <a href="#/signup" className="auth-btn auth-btn--secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Sign Up Again
              </a>
              <a href="#/login" className="auth-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Go to Login
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Floating orbs */}
      <div className="auth-orb auth-orb--1"></div>
      <div className="auth-orb auth-orb--2"></div>
      <div className="auth-orb auth-orb--3"></div>
    </div>
  );
}

export default VerifyEmail;
