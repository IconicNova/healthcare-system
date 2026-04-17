'use client';

import { AlertTriangle, Building2, Clock, FileText, MapPin, Trash2, User, X } from 'lucide-react';

import { getVisitStatusLabel, STATUS_COLORS } from '@/lib/scheduling';

export default function VisitDetailsDialog({ visit, onClose, onEdit, onDelete }) {
  if (!visit) {
    return null;
  }

  const statusColor = STATUS_COLORS[visit.status] || '#6B7280';
  const assignmentState = visit.staff ? 'Assigned caregiver' : 'Open for assignment';
  const carePlanMismatch =
    visit.carePlan?.staffId && visit.staffId && visit.carePlan.staffId !== visit.staffId
      ? `Assigned staff differs from the care plan primary staff${visit.carePlan.staff ? ` (${visit.carePlan.staff.firstName} ${visit.carePlan.staff.lastName})` : ''}.`
      : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          maxWidth: '480px',
          width: '90%',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-2xl)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
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
              }}
            >
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
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: `${statusColor}20`,
                color: statusColor,
              }}
            >
              {getVisitStatusLabel(visit.status)}
            </span>
          </div>

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
                  {visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {assignmentState}
                </p>
                {visit.staff?.phone ? (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {visit.staff.phone}
                  </p>
                ) : null}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>{visit.client?.address}</p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  {visit.client?.city}, {visit.client?.state} {visit.client?.zipCode}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Building2 size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {visit.branch?.name || 'No branch selected'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Scheduling branch
                </p>
              </div>
            </div>

            {visit.service ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={16} color="var(--color-text-secondary)" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>{visit.service.name}</p>
                  {visit.service.duration ? (
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Duration: {visit.service.duration} minutes
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={16} color="var(--color-text-secondary)" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 500, margin: 0 }}>
                  {visit.carePlan?.name || 'No care plan attached'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Care plan context
                </p>
              </div>
            </div>
          </div>

          {carePlanMismatch ? (
            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#FFF7ED',
                color: '#9A3412',
              }}
            >
              <AlertTriangle size={16} style={{ marginTop: '1px', flexShrink: 0 }} />
              <p style={{ fontSize: '12px', margin: 0 }}>{carePlanMismatch}</p>
            </div>
          ) : null}

          {visit.notes ? (
            <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px' }}>
              <p style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px' }}>Notes</p>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>{visit.notes}</p>
            </div>
          ) : null}
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-gray-50)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
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
