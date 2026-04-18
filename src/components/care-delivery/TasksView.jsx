'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, User, ChevronRight, Users, History, AlertTriangle } from 'lucide-react';
import { STATUS_CONFIG as SHARED_STATUS_CONFIG } from '@/lib/visit-status-machine';
import VisitCalendar from './VisitCalendar';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function TasksView({ clientId, onEditVisit }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pastCollapsed, setPastCollapsed] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const INITIAL_PAST_COUNT = 5;

  useEffect(() => {
    if (!clientId) return;

    const fetchVisits = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/visits`);
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visits || []);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [clientId]);

  const getPastVisits = (allVisits) => {
    if (pastCollapsed && allVisits.length > INITIAL_PAST_COUNT) {
      return allVisits.slice(0, INITIAL_PAST_COUNT);
    }
    return allVisits;
  };

  const togglePast = () => setPastCollapsed(prev => !prev);

  const getVisitsByDate = () => {
    const grouped = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    visits.forEach(visit => {
      const visitDate = new Date(visit.startTime);
      visitDate.setHours(0, 0, 0, 0);

      let key;
      if (visitDate.getTime() === today.getTime()) {
        key = 'today';
      } else if (visitDate.getTime() > today.getTime()) {
        key = 'upcoming';
      } else {
        key = 'past';
      }

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(visit);
    });

    // Sort each group by start time
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    });

    return grouped;
  };

  const groupedVisits = getVisitsByDate();

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderVisitCard = (visit) => {
    const statusConf = SHARED_STATUS_CONFIG[visit.status] || SHARED_STATUS_CONFIG.SCHEDULED;
    const statusColor = statusConf?.color || '#3B82F6';
    const statusBg = statusConf?.bgColor || '#DBEAFE';
    const statusLabel = statusConf?.label || visit.status;

    // Check if visit is overdue (Feature #3: Overdue alerts)
    const now = new Date();
    const visitEnd = new Date(visit.endTime);
    const isOverdue = visit.status === 'SCHEDULED' && visitEnd < now;

    return (
      <div
        key={visit.id}
        onClick={() => onEditVisit && onEditVisit(visit)}
        style={{
          backgroundColor: isOverdue ? '#FFF7ED' : 'var(--color-white)',
          border: `1px solid ${isOverdue ? '#F97316' : (visit.status === 'IN_PROGRESS' ? statusColor : 'var(--color-border)')}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              {visit.title || 'Home Health Visit'}
            </div>
            {visit.description && (
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {visit.description.substring(0, 60)}{visit.description.length > 60 ? '...' : ''}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isOverdue && (
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#F97316', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <AlertTriangle size={12} /> Overdue
              </span>
            )}
            <span style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '4px 8px',
              borderRadius: '12px',
              backgroundColor: statusBg,
              color: statusColor,
            }}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {visit.staff && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} />
              {visit.staff.firstName} {visit.staff.lastName}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            {formatTime(visit.startTime)} - {formatTime(visit.endTime)}
          </div>
        </div>

        {visit.actualStart && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Actual: {formatTime(visit.actualStart)} - {visit.actualEnd ? formatTime(visit.actualEnd) : 'In Progress...'}
          </div>
        )}
      </div>
    );
  };

  if (!clientId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
        <Users size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', fontWeight: 500 }}>Select a client to view their tasks</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <LoadingSkeleton rows={4} type="list" />
      </div>
    );
  }

  const hasVisits = Object.values(groupedVisits).some(visits => visits.length > 0);

  if (!hasVisits) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
        <Calendar size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
        <p style={{ fontSize: '14px', fontWeight: 500 }}>No scheduled visits</p>
        <p style={{ fontSize: '12px', marginTop: '8px' }}>Visits for this client will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Tasks</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowCalendar(!showCalendar)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: showCalendar ? 'var(--color-primary)' : 'white', color: showCalendar ? 'white' : 'var(--color-text-secondary)', fontSize: '11px', cursor: 'pointer' }}>📅 Calendar</button>
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {visits.length} visit{visits.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {showCalendar && <VisitCalendar visits={visits} onSelectVisit={onEditVisit} />}

      {/* Today's Visits */}
      {groupedVisits.today && groupedVisits.today.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            Today ({groupedVisits.today.length})
          </div>
          {groupedVisits.today.map(renderVisitCard)}
        </div>
      )}

      {/* Upcoming Visits */}
      {groupedVisits.upcoming && groupedVisits.upcoming.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ChevronRight size={14} />
            Upcoming ({groupedVisits.upcoming.length})
          </div>
          {groupedVisits.upcoming.map(renderVisitCard)}
        </div>
      )}

      {/* Past Visits — BUG-05 FIX: renamed from misleading "Completed" */}
      {groupedVisits.past && groupedVisits.past.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={14} />
            Past Visits ({groupedVisits.past.length})
          </div>
          {getPastVisits(groupedVisits.past).map(renderVisitCard)}
          {groupedVisits.past.length > INITIAL_PAST_COUNT && (
            <button
              onClick={togglePast}
              style={{
                width: '100%', padding: '10px', marginTop: '8px',
                border: '1px solid var(--color-border)', borderRadius: '8px',
                backgroundColor: 'white', cursor: 'pointer',
                fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)',
              }}
            >
              {pastCollapsed ? `Show ${groupedVisits.past.length - INITIAL_PAST_COUNT} more` : 'Show less'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
