import React from 'react';
import { getCategoryColor, CATEGORY_META } from './AnalyticsPage';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function firstDayOf(year, month)  { return new Date(year, month, 1).getDay(); }

function CalendarPage({ subscriptions }) {
  const today = new Date();
  const [year,  setYear]  = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());
  const [selected, setSelected] = React.useState(today.getDate());

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  // Build renewal map: { 'YYYY-MM-DD': [sub, ...] }
  const renewalMap = React.useMemo(() => {
    const map = {};
    subscriptions.filter(s => s.status === 'Active').forEach(s => {
      const d = s.renewal_date?.split('T')[0];
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(s);
    });
    return map;
  }, [subscriptions]);

  // Calendar grid
  const totalDays = daysInMonth(year, month);
  const startDay  = firstDayOf(year, month);
  const prevDays  = daysInMonth(year, month - 1 < 0 ? 11 : month - 1);

  const cells = [];
  // Prev month filler
  for (let i = startDay - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, current: false });
  }
  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells.push({ day: d, current: true, dateStr, renewals: renewalMap[dateStr] || [] });
  }
  // Next filler
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, current: false });
  }

  // Selected date events
  const selectedDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`;
  const selectedEvents  = renewalMap[selectedDateStr] || [];

  // Month totals
  const monthRenewals = Object.entries(renewalMap).filter(([d]) => d.startsWith(`${year}-${String(month+1).padStart(2,'0')}`));
  const monthTotal    = monthRenewals.reduce((sum, [,subs]) => sum + subs.reduce((s, sub) => s + (parseFloat(sub.cost)||0), 0), 0);
  const monthCount    = monthRenewals.reduce((sum, [,subs]) => sum + subs.length, 0);

  return (
    <div className="calendar-layout">
      {/* Calendar Grid */}
      <div className="calendar-card">
        {/* Nav */}
        <div className="cal-nav">
          <button className="cal-nav__btn" id="cal-prev" onClick={prevMonth}>‹</button>
          <span className="cal-nav__title">{MONTH_NAMES[month]} {year}</span>
          <button className="cal-nav__btn" id="cal-next" onClick={nextMonth}>›</button>
        </div>

        {/* Weekday headers */}
        <div className="cal-weekdays">
          {DAY_NAMES.map(d => <div key={d} className="cal-weekday">{d}</div>)}
        </div>

        {/* Day cells */}
        <div className="cal-grid">
          {cells.map((cell, i) => {
            const isToday   = cell.current && cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSelected= cell.current && cell.day === selected;
            const hasRenewal= cell.current && cell.renewals?.length > 0;

            return (
              <div
                key={i}
                className={[
                  'cal-day',
                  !cell.current ? 'cal-day--other-month' : '',
                  isToday ? 'cal-day--today' : '',
                  isSelected ? 'cal-day--selected' : '',
                  hasRenewal ? 'cal-day--has-renewal' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => cell.current && setSelected(cell.day)}
              >
                <span className="cal-day__num">{cell.day}</span>
                {hasRenewal && (
                  <div className="cal-dots">
                    {cell.renewals.slice(0, 3).map((s, j) => (
                      <div
                        key={j}
                        className="cal-dot"
                        style={{ background: getCategoryColor(s.category), animationDelay: `${j*0.1}s` }}
                        title={s.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Sidebar */}
      <div>
        {/* Day Detail */}
        <div className="cal-detail">
          <div className="cal-detail__header">
            <div className="cal-detail__date">
              {MONTH_NAMES[month]} {selected}, {year}
            </div>
            <div className="cal-detail__sub">
              {selectedEvents.length > 0
                ? `${selectedEvents.length} renewal${selectedEvents.length > 1 ? 's' : ''}`
                : 'No renewals'}
            </div>
          </div>

          {selectedEvents.length === 0 ? (
            <div className="cal-empty">
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗓️</div>
              <div>No subscriptions renewing on this day</div>
            </div>
          ) : (
            <div className="cal-detail__list">
              {selectedEvents.map((s, i) => {
                const color = getCategoryColor(s.category);
                const meta  = CATEGORY_META[s.category] || CATEGORY_META['Other'];
                return (
                  <div key={i} className="cal-event" style={{ animationDelay: `${i*0.08}s` }}>
                    <div className="cal-event__color" style={{ background: color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                        <span>{meta.icon}</span>
                        <div className="cal-event__name">{s.name}</div>
                      </div>
                      <div className="cal-event__cost">₹{parseFloat(s.cost).toFixed(0)} / {s.billing_cycle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Month Summary */}
          <div className="month-summary">
            <div className="month-summary__title">This Month</div>
            <div className="month-summary__row">
              <span className="month-summary__label">Renewals</span>
              <span className="month-summary__value">{monthCount}</span>
            </div>
            <div className="month-summary__row">
              <span className="month-summary__label">Total Due</span>
              <span className="month-summary__value">₹{monthTotal.toFixed(0)}</span>
            </div>
            <div className="month-summary__row">
              <span className="month-summary__label">Busiest Day</span>
              <span className="month-summary__value">
                {monthRenewals.sort(([,a],[,b]) => b.length - a.length)[0]
                  ? new Date(monthRenewals.sort(([,a],[,b]) => b.length - a.length)[0][0]).getDate()
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;
