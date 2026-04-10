'use client';

import { X, Clock, MapPin, User, Trash2 } from 'lucide-react';

const STATUS_COLORS = {
  SCHEDULED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#16A34A',
  CANCELLED: '#9CA3AF',
  NO_SHOW: '#EF4444',
  MISSED: '#EF4444',
};

export default function VisitDetailPopup({ visit, onClose, onEdit, onDelete }) {
  if (!visit) return null;

  const statusColor = STATUS_COLORS[visit.status] || '#6B7280';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        maxWidth: '450px',
        width: '90%',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-2xl)',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: visit.staff?.id ? 'var(--color-primary-light)' : 'var(--color-gray-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 600,
              color: 'white',
            }}>
              {visit.client?.firstName?.charAt(0) || '?'}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {visit.client?.firstName} {visit.client?.lastName}
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Visit #{visit.id.slice(-6).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Status Badge */}
          <div style={{ marginBottom: '20px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 500,
              backgroundColor: statusColor + '20',
              color: statusColor,
            }}>
              {visit.status.replace('_', ' ')}
            </span>
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {new Date(visit.startTime).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {new Date(visit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(visit.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {visit.staff ? (
                    <>
                      <span style={{ color: 'var(--color-text)' }}>
                        {visit.staff.firstName} {visit.staff.lastName}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--color-warning)' }}>Unassigned (Vacant)</span>
                  )}
                </p>
                {visit.staff && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {visit.staff.phone}
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {visit.client?.address}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {visit.client?.city}, {visit.client?.state} {visit.client?.zipCode}
                </p>
              </div>
            </div>

            {visit.service && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Clock size={12} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                    {visit.service.name}
                  </p>
                  {visit.service.duration && (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Duration: {visit.service.duration} minutes
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {visit.notes && (
            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Notes:</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{visit.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-gray-50)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-error)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Close
          </button>
          <button
            onClick={onEdit}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Edit Visit
          </button>
        </div>
      </div>
    </div>
  );
}
