import React from 'react';
import { getCategoryColor, CATEGORY_META } from './AnalyticsPage';

const CATEGORIES     = ['Streaming', 'Music', 'Gaming', 'Productivity', 'Cloud Storage', 'News', 'Fitness', 'Education', 'Other'];
const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly'];
const STATUSES       = ['Active', 'Paused', 'Cancelled', 'Expired'];

const STATUS_META = {
  Active:    { icon: '●', color: '#34D399', desc: 'Subscription is running' },
  Paused:    { icon: '⏸', color: '#FBBF24', desc: 'Temporarily paused' },
  Cancelled: { icon: '✕', color: '#F87171', desc: 'Permanently cancelled' },
  Expired:   { icon: '⌛', color: '#FB923C', desc: 'Renewal date has passed' },
};

const today = () => new Date().toISOString().split('T')[0];

function SubscriptionForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = React.useState({
    name:         initial.name         || '',
    category:     initial.category     || 'Streaming',
    cost:         initial.cost !== undefined ? initial.cost : '',
    billing_cycle:initial.billing_cycle|| 'Monthly',
    start_date:   initial.start_date   ? initial.start_date.split('T')[0]   : today(),
    renewal_date: initial.renewal_date ? initial.renewal_date.split('T')[0] : today(),
    status:       initial.status       || 'Active',
    description:  initial.description  || '',
  });
  const [error, setError] = React.useState('');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = e => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Service name is required.'); return; }
    if (!form.start_date || !form.renewal_date) { setError('Both dates are required.'); return; }
    setError('');
    onSubmit({ ...form, cost: parseFloat(form.cost) || 0 });
  };

  const catColor  = getCategoryColor(form.category);
  const catMeta   = CATEGORY_META[form.category] || CATEGORY_META['Other'];
  const statusMeta= STATUS_META[form.status] || STATUS_META['Active'];
  const isEditing = !!initial.name;

  return (
    <form className="sf" onSubmit={submit}>
      {error && (
        <div className="sf-error">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError('')} className="sf-error__close">✕</button>
        </div>
      )}

      {/* Preview strip */}
      <div className="sf-preview" style={{ '--cat-color': catColor }}>
        <div className="sf-preview__icon">{catMeta.icon}</div>
        <div className="sf-preview__info">
          <div className="sf-preview__name">{form.name || 'Service Name'}</div>
          <div className="sf-preview__cat">{form.category}</div>
        </div>
        <div className="sf-preview__cost">
          {form.cost ? `₹${parseFloat(form.cost).toFixed(0)}` : '—'}
          <span>/{form.billing_cycle === 'Monthly' ? 'mo' : form.billing_cycle === 'Yearly' ? 'yr' : 'qtr'}</span>
        </div>
      </div>

      {/* Name */}
      <div className="sf-row">
        <label className="sf-label">Service Name *</label>
        <input
          className="sf-input"
          name="name"
          value={form.name}
          onChange={handle}
          placeholder="e.g. Netflix, Spotify, Adobe..."
          required
          autoFocus
        />
      </div>

      {/* Category + Billing */}
      <div className="sf-grid">
        <div className="sf-row">
          <label className="sf-label">Category</label>
          <select className="sf-select" name="category" value={form.category} onChange={handle}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CATEGORY_META[c]?.icon} {c}</option>
            ))}
          </select>
        </div>
        <div className="sf-row">
          <label className="sf-label">Billing Cycle</label>
          <select className="sf-select" name="billing_cycle" value={form.billing_cycle} onChange={handle}>
            {BILLING_CYCLES.map(b => <option key={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Cost + Status */}
      <div className="sf-grid">
        <div className="sf-row">
          <label className="sf-label">Cost (₹)</label>
          <div className="sf-input-prefix">
            <span className="sf-prefix">₹</span>
            <input
              className="sf-input sf-input--prefixed"
              name="cost" type="number" min="0" step="0.01"
              value={form.cost} onChange={handle} placeholder="0"
            />
          </div>
        </div>
        <div className="sf-row">
          <label className="sf-label">Status</label>
          <div className="sf-status-select">
            <select className="sf-select" name="status" value={form.status} onChange={handle}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s]?.icon} {s}</option>)}
            </select>
            <div className="sf-status-badge" style={{ color: statusMeta.color, background: `${statusMeta.color}18`, borderColor: `${statusMeta.color}40` }}>
              {statusMeta.desc}
            </div>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="sf-grid">
        <div className="sf-row">
          <label className="sf-label">Start Date *</label>
          <input className="sf-input" name="start_date" type="date" value={form.start_date} onChange={handle} required />
        </div>
        <div className="sf-row">
          <label className="sf-label">Next Renewal *</label>
          <input className="sf-input" name="renewal_date" type="date" value={form.renewal_date} onChange={handle} required />
        </div>
      </div>

      {/* Description */}
      <div className="sf-row">
        <label className="sf-label">Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
        <textarea
          className="sf-input sf-textarea"
          name="description"
          value={form.description}
          onChange={handle}
          rows={2}
          placeholder="Any notes about this subscription..."
        />
      </div>

      {/* Actions */}
      <div className="sf-actions">
        <button type="submit" className="sf-btn-submit" style={{ '--cat-color': catColor }}>
          <span>{isEditing ? '💾 Update' : '✨ Save'} Subscription</span>
        </button>
        <button type="button" className="sf-btn-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default SubscriptionForm;
