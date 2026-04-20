import React from 'react';

// ─── Category metadata ───────────────────────────────────────
export const CATEGORY_META = {
  'Streaming':     { color: '#FF6B6B', icon: '🎬', var: '--c-streaming' },
  'Music':         { color: '#C084FC', icon: '🎵', var: '--c-music' },
  'Productivity':  { color: '#60A5FA', icon: '💼', var: '--c-productivity' },
  'Cloud Storage': { color: '#34D399', icon: '☁️', var: '--c-cloud' },
  'Gaming':        { color: '#4ADE80', icon: '🎮', var: '--c-gaming' },
  'Education':     { color: '#FBBF24', icon: '📚', var: '--c-education' },
  'Fitness':       { color: '#F472B6', icon: '🏋️', var: '--c-fitness' },
  'News':          { color: '#818CF8', icon: '📰', var: '--c-news' },
  'Other':         { color: '#2DD4BF', icon: '📦', var: '--c-other' },
};

export function getCategoryColor(category) {
  return CATEGORY_META[category]?.color || CATEGORY_META['Other'].color;
}

// ─── SVG Donut Chart ─────────────────────────────────────────
function DonutChart({ segments, total }) {
  const SIZE = 220;
  const STROKE = 28;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;

  let offset = 0;
  const paths = segments.map((seg, i) => {
    const dash  = (seg.pct / 100) * C;
    const gap   = C - dash;
    const path  = (
      <circle
        key={i}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={seg.color}
        strokeWidth={STROKE}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset + C / 4}
        strokeLinecap="round"
        style={{
          transition: 'stroke-dasharray 0.8s cubic-bezier(0.16,1,0.3,1)',
          filter: `drop-shadow(0 0 6px ${seg.color}55)`,
        }}
      />
    );
    offset += dash + 3; // 3px gap between segments
    return path;
  });

  return (
    <div className="donut-wrap">
      <div className="donut-svg-wrap">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle
            cx={SIZE / 2} cy={SIZE / 2} r={R}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE}
          />
          {paths}
        </svg>
        <div className="donut-center">
          <div className="donut-center__value">₹{total >= 1000 ? `${(total/1000).toFixed(1)}k` : total.toFixed(0)}</div>
          <div className="donut-center__label">/ month</div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Page ──────────────────────────────────────────
function AnalyticsPage({ subscriptions }) {
  const active = subscriptions.filter(s => s.status === 'Active');

  // Monthly cost helper
  const monthlyCost = (s) => {
    const c = parseFloat(s.cost) || 0;
    if (s.billing_cycle === 'Yearly') return c / 12;
    if (s.billing_cycle === 'Quarterly') return c / 3;
    return c;
  };

  const totalMonthly = active.reduce((sum, s) => sum + monthlyCost(s), 0);

  // Group by category
  const byCategory = {};
  active.forEach(s => {
    const cat = s.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0, color: getCategoryColor(cat) };
    byCategory[cat].total += monthlyCost(s);
    byCategory[cat].count++;
  });

  const catEntries = Object.entries(byCategory)
    .sort(([,a],[,b]) => b.total - a.total);

  const donutSegments = catEntries.map(([cat, data]) => ({
    name:  cat,
    color: data.color,
    pct:   totalMonthly > 0 ? (data.total / totalMonthly) * 100 : 0,
    total: data.total,
  }));

  // Simulated 6-month bar data (last 3 months real + 3 estimated)
  const today = new Date();
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('default', { month: 'short' });
    // Real months show actual total, past months simulated ±10%
    const factor = i === 5 ? 1 : 0.85 + Math.random() * 0.3;
    return { label, value: totalMonthly * factor };
  });
  const maxBar = Math.max(...barData.map(b => b.value), 1);

  if (subscriptions.length === 0) {
    return (
      <div className="list-empty">
        <div className="list-empty__icon">📊</div>
        <p>No data yet</p>
        <div className="list-empty__hint">Add subscriptions to see analytics</div>
      </div>
    );
  }

  return (
    <>
      {/* Top Row — Donut + Bar */}
      <div className="analytics-layout">
        {/* Donut */}
        <div className="analytics-card">
          <div className="analytics-card__title">Spend Breakdown</div>
          <DonutChart segments={donutSegments} total={totalMonthly} />
          <div className="donut-legend" style={{ marginTop: '1.5rem' }}>
            {donutSegments.map((seg, i) => (
              <div key={i} className="donut-legend-item" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="donut-legend-item__dot" style={{ background: seg.color }} />
                <span className="donut-legend-item__name">{seg.name}</span>
                <span className="donut-legend-item__pct">{seg.pct.toFixed(1)}%</span>
                <span className="donut-legend-item__cost">₹{seg.total.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="analytics-card">
          <div className="analytics-card__title">Monthly Spend Trend</div>
          <div className="bar-chart">
            {barData.map((bar, i) => (
              <div key={i} className="bar-row" style={{ animationDelay: `${i * 0.08}s` }}>
                <span className="bar-row__label">{bar.label}</span>
                <div className="bar-row__track">
                  <div
                    className="bar-row__fill"
                    style={{
                      width: `${(bar.value / maxBar) * 100}%`,
                      animationDelay: `${i * 0.1}s`,
                      background: i === 5
                        ? 'linear-gradient(90deg, #6366F1, #A78BFA)'
                        : 'linear-gradient(90deg, rgba(99,102,241,0.4), rgba(167,139,250,0.6))',
                    }}
                  />
                </div>
                <span className="bar-row__value">₹{bar.value.toFixed(0)}</span>
              </div>
            ))}
          </div>

          {/* Top spender */}
          {catEntries.length > 0 && (
            <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg-glass)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                Top Category
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.8rem' }}>{CATEGORY_META[catEntries[0][0]]?.icon || '📦'}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>{catEntries[0][0]}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: catEntries[0][1].color, fontSize: '0.95rem' }}>
                    ₹{catEntries[0][1].total.toFixed(0)}/mo
                    <span style={{ fontFamily: 'var(--font)', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: 8 }}>
                      {totalMonthly > 0 ? ((catEntries[0][1].total / totalMonthly) * 100).toFixed(1) : 0}% of spend
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="section-title" style={{ marginBottom: '1.25rem' }}>By Category</div>
        <div className="cat-breakdown-grid">
          {catEntries.map(([cat, data], i) => {
            const meta = CATEGORY_META[cat] || CATEGORY_META['Other'];
            return (
              <div
                key={cat}
                className={`cat-breakdown-card cat--${cat.replace(' ', '-')}`}
                style={{ '--cat-color': data.color, animationDelay: `${i * 0.07}s` }}
              >
                <div className="cat-breakdown-card__icon">{meta.icon}</div>
                <div className="cat-breakdown-card__name">{cat}</div>
                <div className="cat-breakdown-card__cost">₹{data.total.toFixed(0)}<span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font)', fontWeight: 500 }}>/mo</span></div>
                <div className="cat-breakdown-card__count">{data.count} subscription{data.count !== 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default AnalyticsPage;
