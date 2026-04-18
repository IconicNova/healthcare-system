'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/visit-status-machine';

export default function VisitCalendar({ visits = [], onSelectVisit }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay();
    const days = [];

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false, visits: [] });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dayVisits = visits.filter(v => {
        const vd = new Date(v.startTime);
        return vd.getFullYear() === year && vd.getMonth() === month && vd.getDate() === d;
      });
      days.push({ date, isCurrentMonth: true, visits: dayVisits });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false, visits: [] });
    }

    return days;
  }, [currentMonth, visits]);

  const navigate = (dir) => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + dir);
      return next;
    });
  };

  const isToday = (date) => {
    const t = new Date();
    return date.getDate() === t.getDate() && date.getMonth() === t.getMonth() && date.getFullYear() === t.getFullYear();
  };

  return (
    <div style={{ marginBottom: '24px', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--color-gray-50)' }}>
        <button onClick={() => navigate(-1)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)' }}>
          <ChevronLeft size={18} />
        </button>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => navigate(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-secondary)' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} style={{ padding: '8px 4px', textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
            {d}
          </div>
        ))}
        {calendarDays.map((day, i) => (
          <div
            key={i}
            style={{
              padding: '4px',
              minHeight: '50px',
              borderBottom: '1px solid var(--color-border)',
              borderRight: (i + 1) % 7 !== 0 ? '1px solid var(--color-border)' : 'none',
              backgroundColor: isToday(day.date) ? '#EFF6FF' : day.isCurrentMonth ? 'white' : 'var(--color-gray-50)',
              opacity: day.isCurrentMonth ? 1 : 0.4,
            }}
          >
            <div style={{
              fontSize: '11px', fontWeight: isToday(day.date) ? 700 : 400,
              color: isToday(day.date) ? '#1D4ED8' : 'var(--color-text)',
              marginBottom: '2px',
            }}>
              {day.date.getDate()}
            </div>
            {day.visits.slice(0, 2).map((v, vi) => {
              const sc = STATUS_CONFIG[v.status] || {};
              return (
                <div
                  key={vi}
                  onClick={() => onSelectVisit?.(v)}
                  style={{
                    fontSize: '9px',
                    padding: '1px 4px',
                    borderRadius: '3px',
                    backgroundColor: sc.bgColor || '#DBEAFE',
                    color: sc.color || '#1D4ED8',
                    marginBottom: '1px',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {new Date(v.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
              );
            })}
            {day.visits.length > 2 && (
              <div style={{ fontSize: '9px', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                +{day.visits.length - 2}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
