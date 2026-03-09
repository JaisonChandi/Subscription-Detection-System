import React from 'react';

const STATUS_COLORS = {
  Active: '#22c55e',
  Paused: '#f59e0b',
  Cancelled: '#ef4444',
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

function SubscriptionCard({ subscription, onEdit, onDelete }) {
  const { id, name, category, cost, billing_cycle, renewal_date, status, description } = subscription;
  const days = daysUntil(renewal_date);
  const renewalLabel =
    days < 0 ? `Overdue by ${Math.abs(days)} day(s)` :
    days === 0 ? 'Renews today!' :
    `Renews in ${days} day(s)`;

  return (
    <div className={`sub-card ${days <= 7 && status === 'Active' ? 'sub-card--urgent' : ''}`}>
      <div className="sub-card__header">
        <span className="sub-card__icon">{CATEGORY_ICONS[category] || '📦'}</span>
        <div className="sub-card__title-block">
          <h3 className="sub-card__name">{name}</h3>
          <span className="sub-card__category">{category}</span>
        </div>
        <span
          className="sub-card__status"
          style={{ backgroundColor: STATUS_COLORS[status] || '#6b7280' }}
        >
          {status}
        </span>
      </div>

      <div className="sub-card__details">
        <div className="sub-card__detail">
          <span className="label">Cost</span>
          <span className="value">${parseFloat(cost).toFixed(2)} / {billing_cycle}</span>
        </div>
        <div className="sub-card__detail">
          <span className="label">Renewal</span>
          <span className={`value ${days <= 7 && status === 'Active' ? 'text-urgent' : ''}`}>
            {renewalLabel}
          </span>
        </div>
      </div>

      {description && <p className="sub-card__desc">{description}</p>}

      <div className="sub-card__actions">
        <button className="btn btn-sm btn-secondary" onClick={() => onEdit(subscription)}>Edit</button>
        <button className="btn btn-sm btn-danger" onClick={() => onDelete(id)}>Delete</button>
      </div>
    </div>
  );
}

export default SubscriptionCard;
