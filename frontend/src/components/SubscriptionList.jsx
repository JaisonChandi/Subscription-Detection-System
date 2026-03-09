import React from 'react';
import SubscriptionCard from './SubscriptionCard';

function SubscriptionList({ subscriptions, onEdit, onDelete, loading }) {
  if (loading) {
    return <p className="list-placeholder">Loading subscriptions…</p>;
  }

  if (subscriptions.length === 0) {
    return (
      <div className="list-empty">
        <span className="list-empty__icon">📋</span>
        <p>No subscriptions found. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="sub-grid">
      {subscriptions.map((sub) => (
        <SubscriptionCard
          key={sub.id}
          subscription={sub}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

export default SubscriptionList;
