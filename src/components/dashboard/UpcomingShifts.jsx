'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { Calendar, MapPin, User } from 'lucide-react';

export default function UpcomingShifts() {
  const [loading, setLoading] = useState(true);
  const [shifts, setShifts] = useState([]);

  useEffect(() => {
    async function fetchShifts() {
      try {
        const response = await fetch('/api/dashboard/upcoming-shifts');
        if (response.ok) {
          const data = await response.json();
          setShifts(data.shifts);
        }
      } catch (error) {
        console.error('Error fetching upcoming shifts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchShifts();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'warning';
      case 'IN_PROGRESS':
        return 'primary';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Upcoming Shifts
          </h3>
          <div style={{ height: '200px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Upcoming Shifts
          </h3>
          <a
            href="/schedule"
            style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            View All
          </a>
        </div>

        {shifts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              No upcoming shifts scheduled
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Client
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Staff
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Time
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr
                    key={shift.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary-light)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={14} color="var(--color-primary)" />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                            {shift.clientName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={10} />
                            {shift.clientAddress}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                        {shift.staffName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {shift.carePlan}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                        {shift.startTime}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {shift.endTime}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={shift.status} variant={getStatusColor(shift.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
