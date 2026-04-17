'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';

export default function TimesheetEntryForm({ isOpen, onClose, timesheetId, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timesheet, setTimesheet] = useState(null);
  const [renderError, setRenderError] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    notes: '',
    billable: true,
    visitId: null,
  });

  useEffect(() => {
    if (isOpen && timesheetId) {
      setRenderError(null);
      fetchTimesheet();
    }
  }, [isOpen, timesheetId]);

  const formatDateString = (dateValue) => {
    if (!dateValue) return '';
    try {
      const d = new Date(dateValue);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const fetchTimesheet = async () => {
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheetId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setTimesheet(data);
      if (data.startDate) {
        setFormData(prev => ({
          ...prev,
          date: formatDateString(data.startDate) || prev.date,
        }));
      }
    } catch (err) {
      console.error('Error fetching timesheet:', err);
      setRenderError(err.message);
      showToast('Failed to load timesheet data', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      showToast('Please enter valid hours', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheetId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          hours,
          notes: formData.notes || null,
          billable: formData.billable,
          visitId: formData.visitId || null,
        }),
      });

      if (response.ok) {
        showToast('Entry added successfully', 'success');
        onSuccess();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to add entry', 'error');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      showToast('Failed to add entry', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (renderError) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Manual Entry" size="md">
        <div className="modal-body">
          <p style={{ color: 'red' }}>Error: {renderError}</p>
          <button onClick={onClose} className="btn btn-secondary">Close</button>
        </div>
      </Modal>
    );
  }

  const startDateStr = formatDateString(timesheet?.startDate);
  const endDateStr = formatDateString(timesheet?.endDate);

  if (!isOpen) return null;

  return (
    <Modal isOpen={true} onClose={onClose} title="Add Manual Entry" size="md">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="input"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={startDateStr || undefined}
              max={endDateStr || undefined}
              required
            />
            {timesheet && startDateStr && endDateStr && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Must be within: {startDateStr} to {endDateStr}
              </p>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Hours *</label>
            <input
              type="number"
              className="input"
              step="0.25"
              min="0"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="input"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Admin time, Training, Travel"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.billable}
                onChange={(e) => setFormData(prev => ({ ...prev, billable: e.target.checked }))}
              />
              <span style={{ fontSize: '14px', color: 'var(--color-text)' }}>Billable</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-md">
              {loading ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}