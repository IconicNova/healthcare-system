'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildSchedulingSearchParams } from '@/lib/scheduling';

export default function StaffScheduleTab({ staffId }) {
  const router = useRouter();
  const [visits, setVisits] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      // Get visits for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const response = await fetch(
        `/api/staff/${staffId}/visits?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );

      if (response.ok) {
        const data = await response.json();
        setVisits(data);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, currentDate]);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];

    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      days.push({
        date: dayDate,
        isCurrentMonth: true,
        isToday: dayDate.toDateString() === new Date().toDateString(),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  };

  const getVisitsForDay = (dayDate) => {
    return visits.filter(v => {
      const visitDate = new Date(v.startTime);
      return visitDate.toDateString() === dayDate.toDateString();
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      SCHEDULED: '#3B82F6',
      IN_PROGRESS: '#F59E0B',
      COMPLETED: '#16A34A',
      CANCELLED: '#9CA3AF',
      NO_SHOW: '#EF4444',
      MISSED: '#EF4444',
    };
    return colors[status] || '#6B7280';
  };

  const handleDayClick = (dayDate) => {
    const dayVisits = getVisitsForDay(dayDate);
    if (dayVisits.length > 0) {
      const params = buildSchedulingSearchParams({
        date: dayDate,
        filters: {
          staffId,
        },
      });
      router.push(`/scheduling/day?${params.toString()}`);
    }
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Monthly Schedule</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <button onClick={today} style={{ fontSize: '13px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer' }}>
            Today
          </button>
          <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
          <span style={{ fontSize: '14px', fontWeight: 600, minWidth: '180px', textAlign: 'center' }}>
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="card-body" style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '1px', backgroundColor: 'var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
            {/* Weekday Headers */}
            {weekDays.map(day => (
              <div key={day} style={{ backgroundColor: 'var(--color-gray-50)', padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {days.map((day, index) => {
              const dayVisits = getVisitsForDay(day.date);
              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day.date)}
                  style={{
                    backgroundColor: day.isCurrentMonth ? 'white' : 'var(--color-gray-50)',
                    minHeight: '100px',
                    padding: '8px',
                    cursor: dayVisits.length > 0 ? 'pointer' : 'default',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (dayVisits.length > 0) e.currentTarget.style.backgroundColor = 'var(--color-gray-100)';
                  }}
                  onMouseLeave={(e) => {
                    if (dayVisits.length > 0) e.currentTarget.style.backgroundColor = day.isCurrentMonth ? 'white' : 'var(--color-gray-50)';
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: day.isToday ? 700 : 500, color: day.isToday ? 'var(--color-primary)' : (day.isCurrentMonth ? 'var(--color-text)' : 'var(--color-text-muted)'), marginBottom: '6px' }}>
                    {day.date.getDate()}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayVisits.slice(0, 3).map(visit => (
                      <div
                        key={visit.id}
                        style={{
                          fontSize: '11px',
                          padding: '4px 6px',
                          backgroundColor: getStatusColor(visit.status),
                          color: 'white',
                          borderRadius: '4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {visit.client?.firstName?.charAt(0) || '?'} {visit.client?.lastName || ''}
                      </div>
                    ))}
                    {dayVisits.length > 3 && (
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                        +{dayVisits.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[['SCHEDULED', '#3B82F6'], ['COMPLETED', '#16A34A'], ['IN_PROGRESS', '#F59E0B'], ['CANCELLED', '#9CA3AF']].map(([status, color]) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: color }} />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{status.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
