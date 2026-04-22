'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';
import { formatDate } from '@/lib/utils';

export default function GenerateTimesheetModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Set default to current week start
  const getDefaultWeekStart = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    return startOfWeek.toISOString().split('T')[0];
  };

  const [weekStart, setWeekStart] = useState(getDefaultWeekStart());
  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setWeekStart(getDefaultWeekStart());
    }
  }, [isOpen]);

  const getWeekEnd = (startDate) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const handlePreview = async () => {
    if (!weekStart) {
      toast('warning', 'Missing Date', 'Please select a week start date');
      return;
    }

    const startDate = new Date(weekStart);
    const endDate = getWeekEnd(weekStart);

    setPreviewLoading(true);
    try {
      // Fetch completed visits in this date range
      const response = await fetch('/api/visits', {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const visits = (Array.isArray(data) ? data : data.visits || []).filter(v => {
          const visitDate = new Date(v.startTime);
          return (
            ['COMPLETED', 'APPROVED'].includes(v.status) &&
            visitDate >= startDate &&
            visitDate <= endDate &&
            v.staffId &&
            v.staff // Ensure staff object exists
          );
        });

        // Group by staff
        const grouped = visits?.reduce((acc, visit) => {
          if (!acc[visit.staffId]) {
            acc[visit.staffId] = {
              staffId: visit.staffId,
              staffName: `${visit.staff?.firstName || ''} ${visit.staff?.lastName || ''}`.trim() || 'Unknown',
              visits: [],
              totalHours: 0,
            };
          }
          acc[visit.staffId].visits.push(visit);

          // Calculate hours - Priority 1: actual times, Priority 2: scheduled times
          let hours = 0;
          if (visit.actualStart && visit.actualEnd) {
            const start = new Date(visit.actualStart);
            const end = new Date(visit.actualEnd);
            hours = (end - start) / (1000 * 60 * 60);
          } else if (visit.startTime && visit.endTime) {
            const start = new Date(visit.startTime);
            const end = new Date(visit.endTime);
            hours = (end - start) / (1000 * 60 * 60);
          }
          acc[visit.staffId].totalHours += hours;
        }, {});

        setPreview(Object.values(grouped));
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast('error', 'Preview Failed', 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (preview.length === 0) {
      toast('warning', 'No Visits', 'No visits found to generate timesheets');
      return;
    }

    const startDate = new Date(weekStart);
    const endDate = getWeekEnd(weekStart);

    setLoading(true);
    try {
      const response = await fetch('/api/payroll/timesheets/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast('success', 'Generated', data.message);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast('error', 'Generation Failed', error.error || 'Failed to generate timesheets');
      }
    } catch (error) {
      console.error('Error generating timesheets:', error);
      toast('error', 'Generation Failed', 'Failed to generate timesheets');
    } finally {
      setLoading(false);
    }
  };

  const totalStaff = preview.length;
  const totalVisits = preview.reduce((sum, s) => sum + s.visits.length, 0);
  const totalHours = preview.reduce((sum, s) => sum + s.totalHours, 0);
  const totalOvertime = preview.reduce((sum, s) => sum + Math.max(0, s.totalHours - 40), 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Timesheets from Visits" size="lg">
      <div className="modal-body">
        {/* Week Selection */}
        <div style={{ marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Week Start Date *</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="input"
                style={{ flex: 1 }}
              />
              <Button onClick={handlePreview} loading={previewLoading}>
                Preview
              </Button>
            </div>
            {weekStart && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Week: {formatDate(new Date(weekStart))} - {formatDate(getWeekEnd(weekStart))}
              </p>
            )}
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Staff with Completed/Approved Visits</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--color-background-secondary)', position: 'sticky', top: 0 }}>
                    <tr>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Staff</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Visits</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Total Hours</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Overtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((staff) => (
                      <tr key={staff.staffId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{staff.staffName}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{staff.visits.length}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{staff.totalHours.toFixed(2)} hrs</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {staff.totalHours > 40 && (
                            <div style={{ fontSize: '13px', color: 'var(--color-warning)' }}>
                              {(staff.totalHours - 40).toFixed(2)} hrs
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-lighter)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'white', opacity: 0.9 }}>
                  {totalStaff} staff • {totalVisits} visits • {totalHours.toFixed(2)} total hrs
                  {totalOvertime > 0 && ` (${totalOvertime.toFixed(2)} OT) `}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary btn-md">
            Cancel
          </button>
          <Button
            onClick={handleGenerate}
            disabled={loading || preview.length === 0}
            style={{ opacity: preview.length === 0 ? 0.5 : 1 }}
          >
            {loading ? 'Generating...' : `Generate Timesheets (${totalStaff})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
