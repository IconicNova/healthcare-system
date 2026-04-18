'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import { Calendar, Clock, FileText } from 'lucide-react';

const STATUS_VARIANTS = {
  SCHEDULED: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'error',
  NO_SHOW: 'error',
  MISSED: 'error',
};

export default function ClientVisitsTab({ clientId }) {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);

  const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  useEffect(() => {
    async function fetchVisits() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });
        if (statusFilter) params.append('status', statusFilter);

        const response = await fetch(`/api/clients/${clientId}/visits?${params}`);
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visits);
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, pagination.page, statusFilter]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && visits.length === 0) {
    return <div>Loading visits...</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <select
          value={statusFilter}
          onChange={(e) => handleStatusFilter(e.target.value)}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-background)',
            cursor: 'pointer',
          }}
        >
          {STATUS_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
          {pagination.total} visit{pagination.total !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Visits List */}
      {visits.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Calendar size={48} color="var(--color-border)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                No Visits Found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {statusFilter ? 'Try adjusting your filters' : 'Schedule a visit to get started'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date & Time</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Visit Type</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Staff</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tasks</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit, index) => (
                    <tr key={visit.id} style={{ borderBottom: index < visits.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={16} color="var(--color-text-secondary)" />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                              {format(new Date(visit.startTime), 'MMM d, yyyy')}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} />
                              {format(new Date(visit.startTime), 'h:mm a')} - {format(new Date(visit.endTime), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {visit.title || 'Scheduled Visit'}
                        </div>
                        {visit.carePlanName && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            Care Plan: {visit.carePlanName}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--color-primary-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 600 }}>
                            {visit.staffName?.charAt(0)}
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {visit.staffName}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FileText size={14} color="var(--color-text-secondary)" />
                          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {visit.completedTasks}/{visit.totalTasks}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <StatusBadge status={visit.status} variant={STATUS_VARIANTS[visit.status] || 'default'} />
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <button
                          onClick={() => setSelectedVisit(visit)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'transparent',
                            color: 'var(--color-primary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {visits.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          total={pagination.total}
        />
      )}

      {/* Visit Details Modal */}
      {selectedVisit && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: '600px', width: '90%', maxHeight: '90vh', overflow: 'auto', margin: '16px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  Visit Details
                </h3>
                <button
                  onClick={() => setSelectedVisit(null)}
                  style={{ padding: '8px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Date & Time</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                    {format(new Date(selectedVisit.startTime), 'MMM d, yyyy')}
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {format(new Date(selectedVisit.startTime), 'h:mm a')} - {format(new Date(selectedVisit.endTime), 'h:mm a')}
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Status</div>
                  <StatusBadge status={selectedVisit.status} variant={STATUS_VARIANTS[selectedVisit.status] || 'default'} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Visit Type</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{selectedVisit.title || 'Scheduled Visit'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Assigned Staff</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{selectedVisit.staffName || 'Unassigned'}</div>
                </div>
              </div>

              {selectedVisit.carePlanName && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Care Plan</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{selectedVisit.carePlanName}</div>
                </div>
              )}

              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Tasks Completed</div>
                <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                  {selectedVisit.completedTasks}/{selectedVisit.totalTasks} tasks
                </div>
              </div>

              {selectedVisit.notes && (
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Notes</div>
                  <div style={{ fontSize: '14px', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{selectedVisit.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
