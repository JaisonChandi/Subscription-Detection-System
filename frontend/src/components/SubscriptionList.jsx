import React from 'react';
import SubscriptionCard from './SubscriptionCard';

function LoadingSkeleton() {
  return (
    <div className="loading-container">
      {[1, 2, 3].map((i) => (
        <div className="loading-skeleton" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
            <div className="skeleton-line skeleton-line--circle" style={{ marginBottom: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton-line skeleton-line--medium" />
              <div className="skeleton-line skeleton-line--short" style={{ marginBottom: 0 }} />
            </div>
          </div>
          <div className="skeleton-line skeleton-line--wide" />
          <div className="skeleton-line skeleton-line--medium" />
          <div className="skeleton-line skeleton-line--short" style={{ marginBottom: 0 }} />
        </div>
      ))}
    </div>
  );
}

function SubscriptionList({ subscriptions, onEdit, onDelete, loading }) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="list-empty">
        <span className="list-empty__icon">📋</span>
        <p>No subscriptions found</p>
        <span className="list-empty__hint">
          Click "Add Subscription" to start tracking your subscriptions
        </span>
      </div>
    );
  }

  return (
    <div className="sub-grid">
      {subscriptions.map((sub, i) => (
        <SubscriptionCard
          key={sub.id}
          subscription={sub}
          onEdit={onEdit}
          onDelete={onDelete}
          index={i}
        />
      ))}
    </div>
  );
}

export default SubscriptionList;
