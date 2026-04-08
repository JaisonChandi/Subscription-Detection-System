import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState(null);
  const recaptchaRef = React.useRef(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please fill in all fields.');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password, captchaToken);
      window.location.hash = '#/dashboard';
    } catch (err) {
      setError(err.message);
      setCaptchaToken(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__accent"></div>

        {/* Logo */}
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">🔔</span>
          <div>
            <h1 className="auth-card__brand">SubSync</h1>
            <span className="auth-card__tagline">Subscription Detection System</span>
          </div>
        </div>

        <h2 className="auth-card__title">Welcome Back</h2>
        <p className="auth-card__subtitle">Sign in to manage your subscriptions</p>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span>⚠️ {error}</span>
            <button className="auth-alert__close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form__row">
            <label htmlFor="login-email">📧 Email Address</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handle}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="auth-form__row">
            <label htmlFor="login-password">🔒 Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handle}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="auth-captcha">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={RECAPTCHA_SITE_KEY}
              theme="dark"
              onChange={(token) => setCaptchaToken(token)}
              onExpired={() => setCaptchaToken(null)}
            />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-btn__spinner"></span>
                Signing in...
              </>
            ) : (
              <>🚀 Sign In</>
            )}
          </button>
        </form>

        <div className="auth-card__footer">
          <span>Don't have an account?</span>
          <a href="#/signup" className="auth-link">Create Account →</a>
        </div>
      </div>

      {/* Floating orbs */}
      <div className="auth-orb auth-orb--1"></div>
      <div className="auth-orb auth-orb--2"></div>
      <div className="auth-orb auth-orb--3"></div>
    </div>
  );
}

export default LoginPage;
