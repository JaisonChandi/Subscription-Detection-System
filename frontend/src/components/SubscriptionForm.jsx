import React from 'react';

const CATEGORIES = ['Streaming', 'Music', 'Gaming', 'Productivity', 'Cloud Storage', 'News', 'Fitness', 'Education', 'Other'];
const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Yearly'];
const STATUSES = ['Active', 'Paused', 'Cancelled'];

const today = () => new Date().toISOString().split('T')[0];

function SubscriptionForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = React.useState({
    name: initial.name || '',
    category: initial.category || 'Streaming',
    cost: initial.cost !== undefined ? initial.cost : '',
    billing_cycle: initial.billing_cycle || 'Monthly',
    start_date: initial.start_date ? initial.start_date.split('T')[0] : today(),
    renewal_date: initial.renewal_date ? initial.renewal_date.split('T')[0] : today(),
    status: initial.status || 'Active',
    description: initial.description || '',
  });
  const [error, setError] = React.useState('');

  const handle = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!form.start_date || !form.renewal_date) {
      setError('Start date and renewal date are required.');
      return;
    }
    setError('');
    onSubmit({ ...form, cost: parseFloat(form.cost) || 0 });
  };

  return (
    <form className="sub-form" onSubmit={submit}>
      {error && <p className="form-error">{error}</p>}

      <div className="form-row">
        <label>Name *</label>
        <input name="name" value={form.name} onChange={handle} placeholder="e.g. Netflix" required />
      </div>

      <div className="form-row">
        <label>Category</label>
        <select name="category" value={form.category} onChange={handle}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Cost ($)</label>
        <input name="cost" type="number" min="0" step="0.01" value={form.cost} onChange={handle} placeholder="0.00" />
      </div>

      <div className="form-row">
        <label>Billing Cycle</label>
        <select name="billing_cycle" value={form.billing_cycle} onChange={handle}>
          {BILLING_CYCLES.map((b) => <option key={b}>{b}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Start Date *</label>
        <input name="start_date" type="date" value={form.start_date} onChange={handle} required />
      </div>

      <div className="form-row">
        <label>Renewal Date *</label>
        <input name="renewal_date" type="date" value={form.renewal_date} onChange={handle} required />
      </div>

      <div className="form-row">
        <label>Status</label>
        <select name="status" value={form.status} onChange={handle}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handle} rows={3} placeholder="Optional notes..." />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary">Save</button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default SubscriptionForm;
