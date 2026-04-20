import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage       from './components/LoginPage';
import SignupPage      from './components/SignupPage';
import VerifyEmail     from './components/VerifyEmail';
import Sidebar         from './components/Sidebar';
import AnalyticsPage   from './components/AnalyticsPage';
import SubscriptionsPage from './components/SubscriptionsPage';
import CalendarPage    from './components/CalendarPage';
import SubscriptionCard from './components/SubscriptionCard';
import SubscriptionForm from './components/SubscriptionForm';
import EmailScanModal  from './components/EmailScanModal';
import SubscriptionList from './components/SubscriptionList';
import {
  getSubscriptions, createSubscription,
  updateSubscription, deleteSubscription,
} from './services/api';
import { getCategoryColor, CATEGORY_META } from './components/AnalyticsPage';
import './index.css';

// ─── Hash Router ─────────────────────────────────────────────
function useHashRoute() {
  const [route, setRoute] = React.useState(window.location.hash || '#/dashboard');
  React.useEffect(() => {
    const onHash = () => setRoute(window.location.hash || '#/dashboard');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return route;
}

// ─── Helpers ─────────────────────────────────────────────────
function monthlyCost(s) {
  const c = parseFloat(s.cost) || 0;
  if (s.billing_cycle === 'Yearly')    return c / 12;
  if (s.billing_cycle === 'Quarterly') return c / 3;
  return c;
}
function totalMonthly(subs) {
  return subs.filter(s => s.status === 'Active').reduce((sum, s) => sum + monthlyCost(s), 0);
}
function daysUntil(dateStr) {
  const now = new Date(); now.setHours(0,0,0,0);
  const t   = new Date(dateStr); t.setHours(0,0,0,0);
  return Math.round((t - now) / (1000*60*60*24));
}

// ─── Dashboard Page ───────────────────────────────────────────
function DashboardPage({ subscriptions, onEdit, onDelete, onAdd, filter, setFilter, loading, error, setError }) {
  const activeCount    = subscriptions.filter(s => s.status === 'Active').length;
  const pausedCount    = subscriptions.filter(s => s.status === 'Paused').length;
  const cancelledCount = subscriptions.filter(s => s.status === 'Cancelled').length;
  const monthly        = totalMonthly(subscriptions);

  const upcoming = subscriptions
    .filter(s => s.status === 'Active' && daysUntil(s.renewal_date) >= 0)
    .sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date))
    .slice(0, 5);

  const filterCounts = {
    All: subscriptions.length, Active: activeCount,
    Paused: pausedCount, Cancelled: cancelledCount,
    Expired: subscriptions.filter(s => s.status === 'Expired').length,
  };

  const filtered = filter === 'All' ? subscriptions : subscriptions.filter(s => s.status === filter);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      {error && (
        <div className="alert alert-error" style={{ margin: '0 2.5rem 1rem' }}>
          <span>⚠️ {error}</span>
          <button className="alert__close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Total Subscriptions', value: subscriptions.length,    icon:'☰',  color:'purple', delta:null },
          { label:'Active',              value: activeCount,              icon:'●',  color:'green',  delta:`${cancelledCount} cancelled` },
          { label:'Monthly Spend',       value:`₹${monthly.toFixed(0)}`, icon:'₹',  color:'amber',  delta:`₹${(monthly*12).toFixed(0)}/yr` },
          { label:'Paused / Expired',    value: pausedCount + subscriptions.filter(s=>s.status==='Expired').length, icon:'⏸', color:'red', delta:null },
        ].map((card, i) => (
          <div key={i} className={`stat-card stat-card--${card.color}`} style={{ animationDelay:`${i*0.08}s` }}>
            <div className="stat-card__accent" />
            <div className="stat-card__icon-wrap">{card.icon}</div>
            <div className="stat-card__label">{card.label}</div>
            <div className="stat-card__value">{card.value}</div>
            {card.delta && <div className="stat-card__delta">{card.delta}</div>}
          </div>
        ))}
      </div>

      {/* Two-column layout for upcoming + list */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'1.5rem', marginBottom:'2rem' }}>
        
        {/* Upcoming Renewals */}
        <div>
          <div className="section-title" style={{ marginBottom:'1rem' }}>Upcoming Renewals</div>
          {upcoming.length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'1rem 0' }}>No upcoming renewals</div>
          ) : (
            <div className="renewals-list">
              {upcoming.map((s, i) => {
                const color = getCategoryColor(s.category);
                const days  = daysUntil(s.renewal_date);
                return (
                  <div
                    key={s.id}
                    className={`renewal-item cat--${(s.category||'Other').replace(' ','-')}`}
                    style={{ '--cat-color': color, animationDelay:`${i*0.07}s` }}
                  >
                    <div className="renewal-item__dot" />
                    <div className="renewal-item__info">
                      <div className="renewal-item__name">{s.name}</div>
                      <div className="renewal-item__date">
                        {new Date(s.renewal_date).toLocaleDateString('en-IN',{month:'short',day:'numeric',year:'numeric'})}
                      </div>
                    </div>
                    <span className="renewal-item__cost">₹{parseFloat(s.cost).toFixed(0)}</span>
                    <span className={`renewal-item__days ${days === 0 ? 'renewal-item__days--today' : days <= 7 ? 'renewal-item__days--soon' : 'renewal-item__days--ok'}`}>
                      {days === 0 ? 'Today' : `${days}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subscription Cards */}
        <div>
          <div className="section-header">
            <div className="section-title">Your Subscriptions</div>
            <button className="btn-add" onClick={onAdd}>
              <span>+</span><span>Add New</span>
            </button>
          </div>

          {/* Filter */}
          <div className="filter-bar">
            {['All','Active','Paused','Cancelled','Expired'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}<span className="filter-btn__count">{filterCounts[f]}</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-container">
              {[1,2,3].map(n => (
                <div key={n} className="loading-skeleton">
                  <div className="skeleton-line skeleton-line--circle" />
                  <div className="skeleton-line skeleton-line--wide" />
                  <div className="skeleton-line skeleton-line--medium" />
                  <div className="skeleton-line skeleton-line--short" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="list-empty">
              <div className="list-empty__icon">🔔</div>
              <p>{filter === 'All' ? 'No subscriptions yet' : `No ${filter} subscriptions`}</p>
              <div className="list-empty__hint">{filter === 'All' ? 'Add your first subscription or scan your email' : 'Change the filter above'}</div>
            </div>
          ) : (
            <div className="sub-grid">
              {filtered.map((s, i) => (
                <SubscriptionCard key={s.id} subscription={s} index={i} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main App (authenticated) ─────────────────────────────────
function AppMain() {
  const { user } = useAuth();
  const route = useHashRoute();

  const [subscriptions, setSubscriptions] = React.useState([]);
  const [loading,       setLoading]       = React.useState(true);
  const [error,         setError]         = React.useState('');
  const [showForm,      setShowForm]      = React.useState(false);
  const [editing,       setEditing]       = React.useState(null);
  const [filter,        setFilter]        = React.useState('All');
  const [showEmailScan, setShowEmailScan] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await getSubscriptions();
      setSubscriptions(data || []);
    } catch (err) {
      setError('Failed to load subscriptions. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const handleAdd    = ()    => { setEditing(null); setShowForm(true); };
  const handleEdit   = (sub) => { setEditing(sub);  setShowForm(true); };
  const handleCancel = ()    => { setShowForm(false); setEditing(null); };

  const handleSubmit = async (data) => {
    try {
      if (editing) await updateSubscription(editing.id, data);
      else         await createSubscription(data);
      setShowForm(false); setEditing(null);
      await load();
    } catch (err) { setError(err.message || 'Failed to save subscription.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subscription?')) return;
    try { await deleteSubscription(id); await load(); }
    catch (err) { setError(err.message || 'Failed to delete.'); }
  };

  // Page titles
  const PAGE_TITLES = {
    '#/dashboard':      { greeting: `Welcome back, ${user?.full_name?.split(' ')[0] || 'there'} 👋`, title: 'Dashboard', sub: "Here's your subscription overview" },
    '#/analytics':      { greeting: 'Insights', title: 'Analytics', sub: 'See where your money is going' },
    '#/subscriptions':  { greeting: 'All Subscriptions', title: 'Subscriptions', sub: 'Manage and search your services' },
    '#/calendar':       { greeting: 'Renewal Calendar', title: 'Calendar', sub: 'Track upcoming renewal dates' },
  };

  const pageInfo = PAGE_TITLES[route] || PAGE_TITLES['#/dashboard'];

  return (
    <div className="app-shell">
      <Sidebar
        currentRoute={route}
        onScanEmail={() => setShowEmailScan(true)}
      />

      <div className="page-content">
        {/* Page Header */}
        <div className="page-header">
          <div className="page-header__greeting">{pageInfo.greeting}</div>
          <h1 className="page-header__title"><span>{pageInfo.title}</span></h1>
          <div className="page-header__sub">{pageInfo.sub}</div>
        </div>

        {/* Page Body */}
        <div className="page-body">
          {route === '#/dashboard' && (
            <DashboardPage
              subscriptions={subscriptions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAdd={handleAdd}
              filter={filter}
              setFilter={setFilter}
              loading={loading}
              error={error}
              setError={setError}
            />
          )}

          {route === '#/analytics' && (
            <AnalyticsPage subscriptions={subscriptions} />
          )}

          {route === '#/subscriptions' && (
            <SubscriptionsPage
              subscriptions={subscriptions}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}

          {route === '#/calendar' && (
            <CalendarPage subscriptions={subscriptions} />
          )}
        </div>

        <footer className="app-footer">
          SubSync — Subscription Detection System · Built with React &amp; PostgreSQL
        </footer>
      </div>

      {/* Email Scan Modal */}
      {showEmailScan && (
        <EmailScanModal
          onClose={() => setShowEmailScan(false)}
          onImported={() => { setShowEmailScan(false); load(); }}
        />
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleCancel()}>
          <div className="modal">
            <h2>{editing ? '✏️ Edit Subscription' : '✨ Add Subscription'}</h2>
            <SubscriptionForm
              initial={editing || {}}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Router ──────────────────────────────────────────────────
function AppRouter() {
  const { isAuthenticated, loading } = useAuth();
  const route = useHashRoute();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">
          <div className="auth-loading__spinner" />
          <p>Loading SubSync...</p>
        </div>
      </div>
    );
  }

  if (route.startsWith('#/verify-email/')) return <VerifyEmail />;

  if (isAuthenticated) {
    if (route === '#/login' || route === '#/signup' || route === '') {
      window.location.hash = '#/dashboard';
      return null;
    }
    return <AppMain />;
  }

  if (route === '#/signup') return <SignupPage />;
  if (route !== '#/login') window.location.hash = '#/login';
  return <LoginPage />;
}

// ─── Root ────────────────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
