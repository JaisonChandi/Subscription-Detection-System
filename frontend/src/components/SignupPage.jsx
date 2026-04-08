import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '../context/AuthContext';

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0-5
}

const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
const strengthColors = ['', '#f87171', '#fbbf24', '#facc15', '#34d399', '#22d3ee'];

function SignupPage() {
  const { signup } = useAuth();
  const [form, setForm] = React.useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [captchaToken, setCaptchaToken] = React.useState(null);
  const recaptchaRef = React.useRef(null);

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const strength = getPasswordStrength(form.password);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      setError('Please fill in all fields.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA verification.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(form.full_name, form.email, form.password, captchaToken);
      setSuccess(data.message || 'Account created successfully! Check your email for verification.');
      setForm({ full_name: '', email: '', password: '', confirm_password: '' });
      setCaptchaToken(null);
      if (recaptchaRef.current) recaptchaRef.current.reset();
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
      <div className="auth-card auth-card--signup">
        <div className="auth-card__accent"></div>

        {/* Logo */}
        <div className="auth-card__logo">
          <span className="auth-card__logo-icon">🔔</span>
          <div>
            <h1 className="auth-card__brand">SubSync</h1>
            <span className="auth-card__tagline">Subscription Detection System</span>
          </div>
        </div>

        <h2 className="auth-card__title">Create Account</h2>
        <p className="auth-card__subtitle">Start tracking your subscriptions today</p>

        {error && (
          <div className="auth-alert auth-alert--error">
            <span>⚠️ {error}</span>
            <button className="auth-alert__close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert--success">
            <span>✅ {success}</span>
          </div>
        )}

        {!success && (
          <form className="auth-form" onSubmit={submit}>
            <div className="auth-form__row">
              <label htmlFor="signup-name">👤 Full Name</label>
              <input
                id="signup-name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handle}
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>

            <div className="auth-form__row">
              <label htmlFor="signup-email">📧 Email Address</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-password">🔒 Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                value={form.password}
                onChange={handle}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                required
              />
              {form.password && (
                <div className="password-strength">
                  <div className="password-strength__bar">
                    <div
                      className="password-strength__fill"
                      style={{
                        width: `${(strength / 5) * 100}%`,
                        background: strengthColors[strength],
                      }}
                    ></div>
                  </div>
                  <span
                    className="password-strength__label"
                    style={{ color: strengthColors[strength] }}
                  >
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="auth-form__row">
              <label htmlFor="signup-confirm">🔒 Confirm Password</label>
              <input
                id="signup-confirm"
                name="confirm_password"
                type="password"
                value={form.confirm_password}
                onChange={handle}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                required
              />
              {form.confirm_password && form.password !== form.confirm_password && (
                <span className="auth-form__hint auth-form__hint--error">Passwords do not match</span>
              )}
              {form.confirm_password && form.password === form.confirm_password && form.confirm_password.length >= 6 && (
                <span className="auth-form__hint auth-form__hint--success">✓ Passwords match</span>
              )}
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
                  Creating Account...
                </>
              ) : (
                <>✨ Create Account</>
              )}
            </button>
          </form>
        )}

        <div className="auth-card__footer">
          <span>Already have an account?</span>
          <a href="#/login" className="auth-link">Sign In →</a>
        </div>
      </div>

      {/* Floating orbs */}
      <div className="auth-orb auth-orb--1"></div>
      <div className="auth-orb auth-orb--2"></div>
      <div className="auth-orb auth-orb--3"></div>
    </div>
  );
}

export default SignupPage;
