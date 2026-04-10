'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { Check, X, Plus } from 'lucide-react';
import { formatDate, formatTime, hasRoleAccess } from '@/lib/utils';
import { useSession } from '@/lib/auth';
import TimesheetEntryForm from './TimesheetEntryForm';
import { useToast } from '@/components/ui/useToast';

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  APPROVED: 'success',
  REJECTED: 'error',
  PAID: 'success',
};

export default function TimesheetDetail({ timesheet, onClose, onUpdated }) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  if (!timesheet) return null;

  const canApprove = hasRoleAccess(session?.user?.role, ['ADMIN', 'MANAGER']);
  const isSubmitted = timesheet.status === 'SUBMITTED';
  const isDraft = timesheet.status === 'DRAFT';

  const handleApprove = async () => {
    if (!canApprove) return;

    if (!confirm('Approve this timesheet?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });

      if (response.ok) {
        showToast('Timesheet approved', 'success');
        onUpdated();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to approve', 'error');
      }
    } catch (error) {
      console.error('Error approving timesheet:', error);
      showToast('Failed to approve timesheet', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!canApprove) return;

    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', reason }),
      });

      if (response.ok) {
        showToast('Timesheet rejected', 'success');
        onUpdated();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to reject', 'error');
      }
    } catch (error) {
      console.error('Error rejecting timesheet:', error);
      showToast('Failed to reject timesheet', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheet.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SUBMITTED' }),
      });

      if (response.ok) {
        showToast('Timesheet submitted for approval', 'success');
        onUpdated();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to submit', 'error');
      }
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      showToast('Failed to submit timesheet', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overtimeHours = timesheet.totalHours > 40 ? timesheet.totalHours - 40 : 0;

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Timesheet Details" size="lg">
        <div className="modal-body">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {timesheet.staffName}
                </h3>
                <StatusBadge status={timesheet.status} variant={STATUS_VARIANTS[timesheet.status]} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Employee ID: {timesheet.employeeId || 'N/A'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                {timesheet.totalHours?.toFixed(2) || '0.00'} hrs
              </div>
              {overtimeHours > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--color-warning)' }}>
                  {overtimeHours.toFixed(2)} hrs overtime
                </div>
              )}
            </div>
          </div>

          {/* Period */}
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Week Period</p>
            <p style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0 0' }}>
              {formatDate(timesheet.startDate)} - {formatDate(timesheet.endDate)}
            </p>
          </div>

          {/* Entries Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Entries</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Date</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Description</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Clock In</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Clock Out</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {timesheet.timesheetEntries?.map((entry) => (
                    <tr key={entry.id} className="timesheet-entry-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatDate(entry.date)}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {entry.notes || entry.visit ? `${entry.visit.service?.name || 'Service'} - ${entry.visit.client.firstName} ${entry.visit.client.lastName}` : 'Manual Entry'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {entry.visit?.actualStart ? formatTime(entry.visit.actualStart) : entry.visit?.scheduledStart ? formatTime(entry.visit.scheduledStart) : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {entry.visit?.actualEnd ? formatTime(entry.visit.actualEnd) : entry.visit?.scheduledEnd ? formatTime(entry.visit.scheduledEnd) : '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                          {entry.hours?.toFixed(2) || '0.00'} hrs
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(!timesheet.timesheetEntries || timesheet.timesheetEntries.length === 0) && (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                        No entries yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {timesheet.notes && (
            <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Notes</p>
              <p style={{ fontSize: '14px', margin: '4px 0 0' }}>{timesheet.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            {isDraft && (
              <>
                <Button onClick={() => setIsEntryModalOpen(true)} icon={Plus}>
                  Add Entry
                </Button>
                <Button onClick={handleSubmit} loading={isSubmitting}>
                  Submit
                </Button>
              </>
            )}
            {isSubmitted && canApprove && (
              <>
                <Button onClick={handleApprove} loading={isSubmitting} icon={Check}>
                  Approve
                </Button>
                <Button onClick={handleReject} variant="secondary" icon={X}>
                  Reject
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal>

      {isEntryModalOpen && (
        <TimesheetEntryForm
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          timesheetId={timesheet.id}
          onSuccess={() => {
            setIsEntryModalOpen(false);
            onUpdated();
          }}
        />
      )}
    </>
  );
}
