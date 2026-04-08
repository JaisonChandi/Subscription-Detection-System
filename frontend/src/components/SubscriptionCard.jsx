import React from 'react';

const STATUS_COLORS = {
  Active:    'sub-card__status--active',
  Paused:    'sub-card__status--paused',
  Cancelled: 'sub-card__status--cancelled',
  Expired:   'sub-card__status--expired',
};

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

function daysUntil(dateStr) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - now) / (1000 * 60 * 60 * 24));
}

function SubscriptionCard({ subscription, onEdit, onDelete, index = 0 }) {
  const { id, name, category, cost, billing_cycle, renewal_date, status, description } = subscription;
  const days = daysUntil(renewal_date);
  const isUrgent = days <= 7 && status === 'Active';

  const renewalLabel =
    days < 0 ? `Overdue by ${Math.abs(days)} day(s)` :
    days === 0 ? 'Renews today!' :
    `Renews in ${days} day(s)`;

  return (
    <div
      className={`sub-card ${isUrgent ? 'sub-card--urgent' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Header */}
      <div className="sub-card__header">
        <span className="sub-card__icon">
          {CATEGORY_ICONS[category] || '📦'}
        </span>
        <div className="sub-card__title-block">
          <h3 className="sub-card__name">{name}</h3>
          <span className="sub-card__category">{category}</span>
        </div>
        <span className={`sub-card__status ${STATUS_COLORS[status] || ''}`}>
          {status}
        </span>
      </div>

      {/* Divider */}
      <div className="sub-card__divider" />

      {/* Details */}
      <div className="sub-card__details">
        <div className="sub-card__detail">
          <span className="label">
            <span className="label-icon">💳</span> Cost
          </span>
          <span className="value value--cost">
            ₹{parseFloat(cost).toFixed(2)}
            <span style={{ fontSize: '0.75rem', opacity: 0.7, fontFamily: 'var(--font-sans)', fontWeight: 500 }}>
              {' '}/ {billing_cycle}
            </span>
          </span>
        </div>
        <div className="sub-card__detail">
          <span className="label">
            <span className="label-icon">{isUrgent ? '⚡' : '🗓️'}</span> Renewal
          </span>
          <span className={`value ${isUrgent ? 'text-urgent' : ''}`}>
            {renewalLabel}
          </span>
        </div>
      </div>

      {/* Description */}
      {description && <p className="sub-card__desc">{description}</p>}

      {/* Actions */}
      <div className="sub-card__actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(subscription)}>
          ✏️ Edit
        </button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(id)}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}

export default SubscriptionCard;
