import React from 'react';
import { getCategoryColor, CATEGORY_META } from './AnalyticsPage';

function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const t   = new Date(dateStr); t.setHours(0,0,0,0);
  return Math.round((t - now) / (1000*60*60*24));
}

const STATUS_CLASS = {
  Active:    'sub-card__status--active',
  Paused:    'sub-card__status--paused',
  Cancelled: 'sub-card__status--cancelled',
  Expired:   'sub-card__status--expired',
};

function SubscriptionCard({ subscription, onEdit, onDelete, index = 0 }) {
  const { id, name, category, cost, billing_cycle, renewal_date, status, description } = subscription;
  const color = getCategoryColor(category);
  const meta  = CATEGORY_META[category] || CATEGORY_META['Other'];
  const days  = daysUntil(renewal_date);
  const isUrgent = days <= 7 && status === 'Active';

  const renewalLabel =
    days < 0  ? `Overdue by ${Math.abs(days)}d` :
    days === 0 ? 'Renews today!' :
    `Renews in ${days}d`;

  return (
    <div
      className={`sub-card cat--${(category||'Other').replace(' ','-')} ${isUrgent ? 'sub-card--urgent' : ''}`}
      style={{ '--cat-color': color, animationDelay: `${index * 0.06}s` }}
    >
      {/* Left color bar */}
      <div className="sub-card__left-bar" />

      {/* Header */}
      <div className="sub-card__header">
        <div className="sub-card__icon">{meta.icon}</div>
        <div className="sub-card__title-block">
          <h3 className="sub-card__name">{name}</h3>
          <span className="sub-card__category">{category || 'Other'}</span>
        </div>
        <span className={`sub-card__status ${STATUS_CLASS[status] || ''}`}>{status}</span>
      </div>

      <div className="sub-card__divider" />

      {/* Details */}
      <div className="sub-card__details">
        <div className="sub-card__detail">
          <span className="label">💳 Cost</span>
          <span className="value value--cost">
            ₹{parseFloat(cost).toFixed(0)}
            <span style={{ fontSize:'0.73rem', opacity:0.65, fontFamily:'var(--font)', fontWeight:500 }}> /{billing_cycle}</span>
          </span>
        </div>
        <div className="sub-card__detail">
          <span className="label">{isUrgent ? '⚡' : '🗓️'} Renewal</span>
          <span className={`value ${isUrgent ? 'text-urgent' : ''}`}>{renewalLabel}</span>
        </div>
      </div>

      {description && <p className="sub-card__desc">{description}</p>}

      {/* Actions */}
      <div className="sub-card__actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(subscription)}>✏️ Edit</button>
        <button className="btn btn-sm btn-danger"    onClick={() => onDelete(id)}>🗑️ Delete</button>
      </div>
    </div>
  );
}

export default SubscriptionCard;
