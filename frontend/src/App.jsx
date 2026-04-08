import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import VerifyEmail from './components/VerifyEmail';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionForm from './components/SubscriptionForm';
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
} from './services/api';
import EmailScanModal from './components/EmailScanModal';
import './index.css';

// ─── Simple hash-based router ───────────────────────────────
function useHashRoute() {
  const [route, setRoute] = React.useState(window.location.hash || '#/login');

  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/login');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  return route;
}

// ─── Dashboard (the existing app content) ───────────────────
function totalMonthlyCost(subscriptions) {
  return subscriptions
    .filter((s) => s.status === 'Active')
    .reduce((sum, s) => {
      const cost = parseFloat(s.cost) || 0;
      if (s.billing_cycle === 'Yearly') return sum + cost / 12;
      if (s.billing_cycle === 'Quarterly') return sum + cost / 3;
      return sum + cost;
    }, 0);
}

function Dashboard() {
  const { user, logout } = useAuth();
  const [subscriptions, setSubscriptions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [showForm, setShowForm] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [filter, setFilter] = React.useState('All');
  const [showEmailScan, setShowEmailScan] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getSubscriptions();
      setSubscriptions(data);
    } catch (err) {
      setError('Failed to load subscriptions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleAdd = () => { setEditing(null); setShowForm(true); };
  const handleEdit = (sub) => { setEditing(sub); setShowForm(true); };
  const handleCancel = () => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (data) => {
    try {
      if (editing) {
        await updateSubscription(editing.id, data);
      } else {
        await createSubscription(data);
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to save subscription.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    try {
      await deleteSubscription(id);
      await load();
    } catch (err) {
      setError(err.message || 'Failed to delete subscription.');
    }
  };

  const filtered = filter === 'All' ? subscriptions : subscriptions.filter((s) => s.status === filter);
  const monthly = totalMonthlyCost(subscriptions);
  const activeCount    = subscriptions.filter((s) => s.status === 'Active').length;
  const pausedCount    = subscriptions.filter((s) => s.status === 'Paused').length;
  const cancelledCount = subscriptions.filter((s) => s.status === 'Cancelled').length;
  const expiredCount   = subscriptions.filter((s) => s.status === 'Expired').length;

  const filterCounts = {
    All: subscriptions.length,
    Active: activeCount,
    Paused: pausedCount,
    Cancelled: cancelledCount,
    Expired: expiredCount,
  };

  return (
    <div className="app">
      {/* ─── Header ─── */}
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">🔔</span>
            <div>
              <h1>SubSync</h1>
              <span className="app-header__subtitle">Subscription Detection System</span>
            </div>
          </div>
          <div className="app-header__actions">
            <button className="btn-scan-email" onClick={() => setShowEmailScan(true)}>
              <span>📧</span>
              <span>Scan Email</span>
            </button>
            <button className="btn-add" onClick={handleAdd}>
              <span className="btn-add__icon">+</span>
              <span>Add Subscription</span>
            </button>
            <div className="user-menu">
              <button className="user-menu__btn">
                <span className="user-menu__avatar">
                  {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
                <span className="user-menu__name">{user?.full_name || 'User'}</span>
              </button>
              <button className="btn-logout" onClick={logout} title="Sign Out">
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="app-main">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <span>⚠️ {error}</span>
            <button className="alert__close" onClick={() => setError('')}>✕</button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="stats-bar">
          <div className="stat-card">
            <span className="stat-card__icon">📊</span>
            <span className="stat-card__label">Total Subscriptions</span>
            <span className="stat-card__value">{subscriptions.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon">✅</span>
            <span className="stat-card__label">Active</span>
            <span className="stat-card__value">{activeCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon">💰</span>
            <span className="stat-card__label">Monthly Spend</span>
            <span className="stat-card__value">₹{monthly.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon">📅</span>
            <span className="stat-card__label">Annual Spend</span>
            <span className="stat-card__value">₹{(monthly * 12).toFixed(2)}</span>
          </div>
        </div>

        {/* Email Scan Modal */}
        {showEmailScan && (
          <EmailScanModal
            onClose={() => setShowEmailScan(false)}
            onImported={() => { setShowEmailScan(false); load(); }}
          />
        )}

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleCancel()}>
            <div className="modal">
              <h2>{editing ? '✏️ Edit Subscription' : '✨ New Subscription'}</h2>
              <SubscriptionForm
                initial={editing || {}}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <h3 className="section-title">Your Subscriptions</h3>
        <div className="filter-bar">
          {['All', 'Active', 'Paused', 'Cancelled', 'Expired'].map((f) => (
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

        {/* Subscription List */}
        <SubscriptionList
          subscriptions={filtered}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </main>

      {/* ─── Footer ─── */}
      <footer className="app-footer">
        SubSync — Subscription Detection System &middot; Built with React & PostgreSQL
      </footer>
    </div>
  );
}

// ─── App Router ─────────────────────────────────────────────
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();
  const route = useHashRoute();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="auth-loading__spinner"></div>
          <p>Loading SubSync...</p>
        </div>
      </div>
    );
  }

  // Route: email verification (accessible without auth)
  if (route.startsWith('#/verify-email/')) {
    return <VerifyEmail />;
  }

  // Authenticated routes
  if (isAuthenticated) {
    // Redirect to dashboard if trying to access login/signup
    if (route === '#/login' || route === '#/signup' || route === '') {
      window.location.hash = '#/dashboard';
      return null;
    }
    return <Dashboard />;
  }

  // Not authenticated
  if (route === '#/signup') return <SignupPage />;
  
  // Default: login
  if (route !== '#/login') window.location.hash = '#/login';
  return <LoginPage />;
}

// ─── Root App ───────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
