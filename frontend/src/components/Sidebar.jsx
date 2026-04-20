import React from 'react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',     icon: '⊞',  label: 'Dashboard',     hash: '#/dashboard' },
  { id: 'analytics',    icon: '◔',  label: 'Analytics',     hash: '#/analytics' },
  { id: 'subscriptions',icon: '☰',  label: 'Subscriptions', hash: '#/subscriptions' },
  { id: 'calendar',     icon: '▦',  label: 'Calendar',      hash: '#/calendar' },
];

function Sidebar({ currentRoute, onScanEmail }) {
  const { user, logout } = useAuth();

  const navigate = (hash) => {
    window.location.hash = hash;
  };

  const active = (hash) => currentRoute === hash || currentRoute.startsWith(hash + '/');

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar__brand">
        <div className="sidebar__logo">🔔</div>
        <div className="sidebar__brand-text">
          <h1>SubSync</h1>
          <span>Subscription Tracker</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar__nav-item ${active(item.hash) ? 'sidebar__nav-item--active' : ''}`}
            onClick={() => navigate(item.hash)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}

        <div className="sidebar__divider" />

        {/* Scan Email */}
        <button
          className="sidebar__nav-item"
          onClick={onScanEmail}
          style={{ color: 'var(--c-music)' }}
        >
          <span className="nav-icon">📧</span>
          <span className="nav-label">Scan Email</span>
        </button>
      </nav>

      {/* User + Logout */}
      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">
            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.full_name || 'User'}</div>
            <div className="sidebar__user-role">Member</div>
          </div>
        </div>
        <button className="sidebar__logout" onClick={logout}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
