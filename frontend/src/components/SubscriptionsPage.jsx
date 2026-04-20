import React from 'react';
import { getCategoryColor, CATEGORY_META } from './AnalyticsPage';

const STATUS_DOT = {
  Active:    'status-dot--active',
  Paused:    'status-dot--paused',
  Cancelled: 'status-dot--cancelled',
  Expired:   'status-dot--expired',
};
const STATUS_TEXT = {
  Active:    'status-text--active',
  Paused:    'status-text--paused',
  Cancelled: 'status-text--cancelled',
  Expired:   'status-text--expired',
};

function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const target = new Date(dateStr); target.setHours(0,0,0,0);
  return Math.round((target - now) / (1000*60*60*24));
}

function SubscriptionsPage({ subscriptions, onEdit, onDelete }) {
  const [search, setSearch]   = React.useState('');
  const [sort, setSort]       = React.useState('name');
  const [filter, setFilter]   = React.useState('All');

  const filtered = subscriptions
    .filter(s => {
      const q = search.toLowerCase();
      const matchQ = !q || s.name.toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q);
      const matchF = filter === 'All' || s.status === filter;
      return matchQ && matchF;
    })
    .sort((a, b) => {
      if (sort === 'cost') return (parseFloat(b.cost) || 0) - (parseFloat(a.cost) || 0);
      if (sort === 'renewal') return new Date(a.renewal_date) - new Date(b.renewal_date);
      if (sort === 'status') return a.status.localeCompare(b.status);
      return a.name.localeCompare(b.name);
    });

  const filterCounts = ['All','Active','Paused','Cancelled','Expired'].reduce((acc, f) => {
    acc[f] = f === 'All' ? subscriptions.length : subscriptions.filter(s => s.status === f).length;
    return acc;
  }, {});

  return (
    <>
      {/* Toolbar */}
      <div className="subs-toolbar">
        <div className="subs-search">
          <span className="subs-search__icon">🔍</span>
          <input
            id="subs-search-input"
            placeholder="Search by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'0.9rem' }}
            >✕</button>
          )}
        </div>
        <div className="subs-sort">
          <span className="subs-sort__label">Sort:</span>
          <select id="subs-sort-select" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="name">Name</option>
            <option value="cost">Cost (High→Low)</option>
            <option value="renewal">Renewal Date</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {['All','Active','Paused','Cancelled','Expired'].map(f => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
            <span className="filter-btn__count">{filterCounts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="list-empty">
          <div className="list-empty__icon">🔎</div>
          <p>No subscriptions found</p>
          <div className="list-empty__hint">Try changing your search or filter</div>
        </div>
      ) : (
        <div className="subs-table-wrap">
          <table className="subs-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Renewal</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const color = getCategoryColor(s.category);
                const meta  = CATEGORY_META[s.category] || CATEGORY_META['Other'];
                const days  = daysUntil(s.renewal_date);
                const renewLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d`;
                const renewUrgent = days <= 7 && s.status === 'Active';
                return (
                  <tr key={s.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td>
                      <div className="table-name-cell">
                        <div className="table-icon" style={{ boxShadow: `0 0 12px -4px ${color}` }}>
                          {meta.icon}
                        </div>
                        <div>
                          <div className="table-name">{s.name}</div>
                          {s.description && <div className="table-desc">{s.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`cat-pill cat--${(s.category||'Other').replace(' ','-')}`} style={{ '--cat-color': color }}>
                        {s.category || 'Other'}
                      </span>
                    </td>
                    <td>
                      <div className="status-dot-wrap">
                        <div className={`status-dot ${STATUS_DOT[s.status] || ''}`} />
                        <span className={`status-text ${STATUS_TEXT[s.status] || ''}`}>{s.status}</span>
                      </div>
                    </td>
                    <td>
                      <div className="cost-cell">₹{parseFloat(s.cost).toFixed(0)}</div>
                      <div className="cost-cell-cycle">/{s.billing_cycle}</div>
                    </td>
                    <td>
                      <span className={`renewal-cell ${renewUrgent ? 'renewal-urgent' : ''}`}>
                        {renewUrgent ? '⚡ ' : ''}{renewLabel}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(s)}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={() => onDelete(s.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default SubscriptionsPage;
