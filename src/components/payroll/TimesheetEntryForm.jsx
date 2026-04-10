'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/useToast';

export default function TimesheetEntryForm({ isOpen, onClose, timesheetId, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [timesheet, setTimesheet] = useState(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: '',
    notes: '',
    billable: true,
    visitId: null,
  });

  useEffect(() => {
    if (isOpen && timesheetId) {
      fetchTimesheet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, timesheetId]);

  const fetchTimesheet = async () => {
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheetId}`);
      if (response.ok) {
        const data = await response.json();
        setTimesheet(data);
        // Set date to be within timesheet period
        setFormData(prev => ({
          ...prev,
          date: data.startDate ? data.startDate.toISOString().split('T')[0] : prev.date,
        }));
      }
    } catch (error) {
      console.error('Error fetching timesheet:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      showToast('Please enter valid hours', 'warning');
      return;
    }

    // Check date is within timesheet period
    if (timesheet) {
      const entryDate = new Date(formData.date);
      if (entryDate < timesheet.startDate || entryDate > timesheet.endDate) {
        showToast(`Date must be between ${timesheet.startDate.toISOString().split('T')[0]} and ${timesheet.endDate.toISOString().split('T')[0]}`, 'error');
        return;
      }
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Manual Entry" size="md">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Date */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Date *</label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={timesheet?.startDate?.toISOString().split('T')[0]}
              max={timesheet?.endDate?.toISOString().split('T')[0]}
              required
            />
            {timesheet && (
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                Must be within: {timesheet.startDate.toISOString().split('T')[0]} to {timesheet.endDate.toISOString().split('T')[0]}
              </p>
            )}
          </div>

          {/* Hours */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Hours *</label>
            <Input
              type="number"
              step="0.25"
              min="0"
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Description</label>
            <Input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Admin time, Training, Travel"
            />
          </div>

          {/* Billable */}
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

          {/* Actions */}
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
