'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Calendar, User, ChevronRight, Users } from 'lucide-react';

const STATUS_CONFIG = {
  VACANT: { label: 'Vacant', color: '#8B5CF6', bg: '#8B5CF615' },
  OFFERED: { label: 'Offered', color: '#6366F1', bg: '#6366F115' },
  SCHEDULED: { label: 'Scheduled', color: '#3B82F6', bg: '#3B82F615' },
  IN_PROGRESS: { label: 'In Progress', color: '#F59E0B', bg: '#F59E0B15' },
  CLOCKED_IN: { label: 'Clocked In', color: '#0EA5E9', bg: '#0EA5E915' },
  COMPLETED: { label: 'Completed', color: '#16A34A', bg: '#16A34A15' },
  APPROVED: { label: 'Approved', color: '#059669', bg: '#05966915' },
  CANCELLED: { label: 'Cancelled', color: '#9CA3AF', bg: '#9CA3AF15' },
  ON_HOLD: { label: 'On Hold', color: '#F97316', bg: '#F9731615' },
  NO_SHOW: { label: 'No Show', color: '#EF4444', bg: '#EF444415' },
  MISSED: { label: 'Missed', color: '#EF4444', bg: '#EF444415' },
  LATE: { label: 'Late', color: '#F97316', bg: '#F9731615' },
};

export default function TasksView({ clientId, onEditVisit }) {
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getVisitsByDate = (visits) => {
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

  const groupedVisits = getVisitsByDate(visits);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderVisitCard = (visit) => {
    const status = STATUS_CONFIG[visit.status] || STATUS_CONFIG.SCHEDULED;

    return (
      <div
        key={visit.id}
        onClick={() => onEditVisit && onEditVisit(visit)}
        style={{
          backgroundColor: 'var(--color-white)',
          border: `1px solid ${visit.status === 'IN_PROGRESS' ? status.color : 'var(--color-border)'}`,
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
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
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: '12px',
            backgroundColor: status.bg,
            color: status.color,
          }}>
            {status.label}
          </span>
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
        <div className="loading-spinner" />
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
        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
          {visits.length} visit{visits.length !== 1 ? 's' : ''}
        </span>
      </div>

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

      {/* Past Visits */}
      {groupedVisits.past && groupedVisits.past.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14} />
            Completed ({groupedVisits.past.length})
          </div>
          {groupedVisits.past.slice(0, 5).map(renderVisitCard)}
          {groupedVisits.past.length > 5 && (
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              +{groupedVisits.past.length - 5} more past visits
            </div>
          )}
        </div>
      )}
    </div>
  );
}
