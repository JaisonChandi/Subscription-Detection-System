import React, { useState } from 'react';
import { scanEmail, importDetectedSubscriptions } from '../services/api';

// ─── IMAP Presets ──────────────────────────────────────────
const PRESETS = [
  {
    id: 'gmail',
    label: 'Gmail',
    icon: '📧',
    color: '#EA4335',
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    hint: 'Use an App Password. Go to Google Account → Security → 2-Step Verification → App Passwords.',
    helpUrl: 'https://myaccount.google.com/apppasswords',
  },
  {
    id: 'outlook',
    label: 'Outlook / Hotmail',
    icon: '📨',
    color: '#0078D4',
    host: 'outlook.office365.com',
    port: 993,
    tls: true,
    hint: 'Use your regular Microsoft account password, or an App Password if 2FA is enabled.',
    helpUrl: 'https://account.microsoft.com/security',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Mail',
    icon: '💌',
    color: '#720E9E',
    host: 'imap.mail.yahoo.com',
    port: 993,
    tls: true,
    hint: 'Generate an App Password: Yahoo → Account Security → Manage App Passwords.',
    helpUrl: 'https://login.yahoo.com/account/security',
  },
  {
    id: 'custom',
    label: 'Other / Custom',
    icon: '⚙️',
    color: '#8b8ba3',
    host: '',
    port: 993,
    tls: true,
    hint: 'Enter your IMAP server details manually.',
    helpUrl: null,
  },
];

const CATEGORY_ICONS = {
  Streaming: '🎬',
  Music: '🎵',
  Gaming: '🎮',
  Productivity: '💼',
  'Cloud Storage': '☁️',
  News: '📰',
  Fitness: '🏋️',
  Education: '📚',
  Other: '📦',
};

// ─── Steps ─────────────────────────────────────────────────
const STEPS = ['choose', 'credentials', 'scanning', 'results'];

export default function EmailScanModal({ onClose, onImported }) {
  const [step, setStep]         = useState('choose');
  const [preset, setPreset]     = useState(null);
  const [form, setForm]         = useState({ host: '', port: 993, user: '', password: '', tls: true });
  const [scanData, setScanData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);

  // ── Progress state ──────────────────────────────────────
  const [progress, setProgress] = useState({
    percent: 0,
    scanned: 0,
    total: 0,
    found: 0,
    secondsRemaining: null,
    statusMsg: 'Connecting to mail server...',
  });

  /* ── Choose preset ── */
  function handlePreset(p) {
    setPreset(p);
    setForm(f => ({ ...f, host: p.host, port: p.port, tls: p.tls }));
    setStep('credentials');
    setError('');
  }

  /* ── Start scan ── */
  async function handleScan(e) {
    e.preventDefault();
    setError('');
    setProgress({ percent: 0, scanned: 0, total: 0, found: 0, secondsRemaining: null, statusMsg: 'Connecting to mail server...' });
    setStep('scanning');
    try {
      const result = await scanEmail(
        { host: form.host, port: form.port, user: form.user, password: form.password, tls: form.tls },
        (event) => {
          if (event.type === 'status') {
            setProgress(p => ({ ...p, percent: event.percent || p.percent, statusMsg: event.message, total: event.total || p.total }));
          } else if (event.type === 'progress') {
            setProgress({
              percent: event.percent,
              scanned: event.scanned,
              total: event.total,
              found: event.found,
              secondsRemaining: event.secondsRemaining,
              statusMsg: `Scanning email ${event.scanned} of ${event.total}...`,
            });
          }
        }
      );
      setScanData(result);
      setSelected(result.detected.map((_, i) => i));
      setStep('results');
    } catch (err) {
      setError(err.message || 'Email scan failed.');
      setStep('credentials');
    }
  }

  /* ── Toggle row selection ── */
  function toggleSelect(i) {
    setSelected(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  /* ── Import selected ── */
  async function handleImport() {
    const toImport = (scanData?.detected || []).filter((_, i) => selected.includes(i));
    if (!toImport.length) return;
    setImporting(true);
    try {
      const res = await importDetectedSubscriptions(toImport);
      setImportResult(res);
      onImported?.();
    } catch (err) {
      setError(err.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  }

  /* ── Render body per step ── */
  function renderStep() {
    /* ── STEP: choose ── */
    if (step === 'choose') return (
      <div className="esm-choose">
        <div className="esm-hero">
          <span className="esm-hero__icon">📬</span>
          <div>
            <h2 className="esm-title">Scan Email for Subscriptions</h2>
            <p className="esm-subtitle">
              Connect your inbox and we'll automatically detect active & expired subscriptions from receipt emails.
            </p>
          </div>
        </div>

        <div className="esm-disclaimer">
          <span className="esm-disclaimer__icon">🔒</span>
          <p>Your credentials are used <strong>only</strong> to read email headers locally and are never stored. All scanning happens on <em>your</em> server.</p>
        </div>

        <p className="esm-label">Choose your email provider:</p>
        <div className="esm-presets">
          {PRESETS.map(p => (
            <button key={p.id} className="esm-preset-btn" onClick={() => handlePreset(p)} style={{ '--preset-color': p.color }}>
              <span className="esm-preset-icon">{p.icon}</span>
              <span className="esm-preset-label">{p.label}</span>
              <span className="esm-preset-arrow">→</span>
            </button>
          ))}
        </div>
      </div>
    );

    /* ── STEP: credentials ── */
    if (step === 'credentials') return (
      <form className="esm-creds" onSubmit={handleScan}>
        <button type="button" className="esm-back" onClick={() => { setStep('choose'); setError(''); }}>
          ← Back
        </button>
        <div className="esm-section-header">
          <span style={{ fontSize: '2rem' }}>{preset?.icon}</span>
          <div>
            <h2 className="esm-title">{preset?.label || 'Custom IMAP'}</h2>
            <p className="esm-subtitle">Enter your email credentials to begin scanning.</p>
          </div>
        </div>

        {preset?.hint && (
          <div className="esm-hint">
            <span>💡</span>
            <span>
              {preset.hint}
              {preset.helpUrl && (
                <> <a href={preset.helpUrl} target="_blank" rel="noreferrer" className="esm-hint-link">Generate App Password →</a></>
              )}
            </span>
          </div>
        )}

        {error && <div className="esm-error">⚠️ {error}</div>}

        {preset?.id === 'custom' && (
          <div className="esm-field">
            <label>IMAP Host</label>
            <input type="text" placeholder="imap.example.com" value={form.host}
              onChange={e => setForm(f => ({ ...f, host: e.target.value }))} required />
          </div>
        )}

        <div className="esm-field">
          <label>Email Address</label>
          <input type="email" placeholder="you@gmail.com" value={form.user}
            onChange={e => setForm(f => ({ ...f, user: e.target.value }))} required autoComplete="username" />
        </div>

        <div className="esm-field">
          <label>App Password / Password</label>
          <div className="esm-pass-wrap">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required autoComplete="current-password" />
            <button type="button" className="esm-pass-toggle" onClick={() => setShowPass(s => !s)}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button type="submit" className="esm-scan-btn">
          <span>🔍</span> Start Scanning
        </button>
        <p className="esm-privacy">🔒 Your password is sent directly to your IMAP server and never stored.</p>
      </form>
    );

    /* ── STEP: scanning ── */
    if (step === 'scanning') {
      const { percent, scanned, total, found, secondsRemaining, statusMsg } = progress;

      const formatTime = (secs) => {
        if (!secs || secs <= 0) return null;
        if (secs < 60) return `${secs}s`;
        return `${Math.floor(secs / 60)}m ${secs % 60}s`;
      };

      const timeLabel = percent >= 95
        ? 'Almost done...'
        : secondsRemaining !== null
          ? `~${formatTime(secondsRemaining)} remaining`
          : 'Estimating time...';

      return (
        <div className="esm-scanning">
          <div className="esm-scan-anim">
            <div className="esm-scan-ring esm-scan-ring--1" />
            <div className="esm-scan-ring esm-scan-ring--2" />
            <div className="esm-scan-ring esm-scan-ring--3" />
            <span className="esm-scan-center">📧</span>
          </div>

          <h2 className="esm-title">Scanning Your Inbox...</h2>
          <p className="esm-subtitle" style={{ minHeight: '1.4em' }}>{statusMsg}</p>

          {/* ── Progress bar with % ── */}
          <div className="esm-progress-wrap">
            <div className="esm-progress-bar">
              <div
                className="esm-progress-fill"
                style={{ width: `${percent}%`, transition: 'width 0.4s ease' }}
              />
            </div>
            <div className="esm-progress-meta">
              <span className="esm-progress-pct">{percent}%</span>
              <span className="esm-progress-time">{timeLabel}</span>
            </div>
          </div>

          {/* ── Stats row ── */}
          {total > 0 && (
            <div className="esm-scan-stats">
              <div className="esm-scan-stat">
                <span className="esm-scan-stat__val">{scanned}</span>
                <span className="esm-scan-stat__lbl">Scanned</span>
              </div>
              <div className="esm-scan-stat">
                <span className="esm-scan-stat__val">{total}</span>
                <span className="esm-scan-stat__lbl">Total</span>
              </div>
              <div className="esm-scan-stat">
                <span className="esm-scan-stat__val" style={{ color: 'var(--accent)' }}>{found}</span>
                <span className="esm-scan-stat__lbl">Found</span>
              </div>
            </div>
          )}

          <p className="esm-scan-tip">💡 Tip: We only read email metadata — subject lines and sender info.</p>
        </div>
      );
    }

    /* ── STEP: results ── */
    if (step === 'results') {
      const detected = scanData?.detected || [];

      if (importResult) {
        return (
          <div className="esm-imported">
            <div className="esm-imported-icon">🎉</div>
            <h2 className="esm-title">Import Complete!</h2>
            <p className="esm-subtitle">
              <strong>{importResult.imported}</strong> subscription(s) added to your dashboard.
              {importResult.skipped > 0 && <> &nbsp;<span className="esm-skipped">{importResult.skipped} skipped</span> (already exist).</>}
            </p>
            <button className="esm-scan-btn" onClick={onClose}>✅ Go to Dashboard</button>
          </div>
        );
      }

      return (
        <div className="esm-results">
          <div className="esm-results-header">
            <div>
              <h2 className="esm-title">
                {detected.length > 0 ? `Found ${detected.length} Subscription(s)` : 'No Subscriptions Found'}
              </h2>
              <p className="esm-subtitle">
                Scanned <strong>{scanData?.totalScanned || 0}</strong> emails from <em>{scanData?.email}</em>.
              </p>
            </div>
            {detected.length > 0 && (
              <div className="esm-select-all">
                <input type="checkbox" id="esm-select-all"
                  checked={selected.length === detected.length}
                  onChange={() => setSelected(selected.length === detected.length ? [] : detected.map((_, i) => i))} />
                <label htmlFor="esm-select-all">Select all</label>
              </div>
            )}
          </div>

          {error && <div className="esm-error">⚠️ {error}</div>}

          {detected.length === 0 ? (
            <div className="esm-no-results">
              <span>📭</span>
              <p>No subscription receipts found in the past year. Try scanning a different inbox or add subscriptions manually.</p>
              <button className="esm-scan-btn esm-scan-btn--outline" onClick={() => setStep('choose')}>Try Another Email</button>
            </div>
          ) : (
            <>
              <div className="esm-result-list">
                {detected.map((sub, i) => (
                  <div key={i} className={`esm-result-item ${selected.includes(i) ? 'esm-result-item--selected' : ''}`}
                    onClick={() => toggleSelect(i)}>
                    <div className="esm-result-check">
                      <input type="checkbox" checked={selected.includes(i)} onChange={() => toggleSelect(i)}
                        onClick={e => e.stopPropagation()} id={`esm-sub-${i}`} />
                    </div>
                    <div className="esm-result-icon">
                      {sub.icon || CATEGORY_ICONS[sub.category] || '📦'}
                    </div>
                    <div className="esm-result-info">
                      <span className="esm-result-name">{sub.name}</span>
                      <span className="esm-result-meta">{sub.category} · {sub.billing_cycle}</span>
                    </div>
                    <div className="esm-result-cost">
                      ₹{parseFloat(sub.cost).toFixed(0)}
                      <span className="esm-result-status esm-result-status--active">Active</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="esm-import-footer">
                <span className="esm-import-count">
                  {selected.length} of {detected.length} selected
                </span>
                <div className="esm-import-actions">
                  <button className="esm-btn-ghost" onClick={() => setStep('choose')}>Scan Another</button>
                  <button className="esm-scan-btn" onClick={handleImport}
                    disabled={selected.length === 0 || importing}>
                    {importing ? '⏳ Importing...' : `⬇️ Import ${selected.length} Subscription(s)`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      );
    }
  }

  /* ── Progress dots ── */
  const stepIdx = STEPS.indexOf(step);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal esm-modal">
        {/* Close */}
        <button className="esm-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Step indicator */}
        {step !== 'scanning' && (
          <div className="esm-steps">
            {['Provider', 'Credentials', 'Results'].map((label, i) => (
              <div key={i} className={`esm-step ${i <= stepIdx - 0 ? 'esm-step--done' : ''} ${i === stepIdx - 0 ? 'esm-step--active' : ''}`}>
                <div className="esm-step-dot">{i < stepIdx ? '✓' : i + 1}</div>
                <span className="esm-step-label">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="esm-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
