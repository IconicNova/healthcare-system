'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/useToast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TimesheetEntryForm error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Modal isOpen={this.props.isOpen} onClose={this.props.onClose} title="Add Manual Entry" size="md">
          <div className="modal-body">
            <p style={{ color: 'red' }}>Something went wrong: {this.state.error?.message}</p>
            <button onClick={() => this.setState({ hasError: false })} className="btn btn-secondary">
              Try Again
            </button>
          </div>
        </Modal>
      );
    }

    return this.props.children;
  }
}

function TimesheetEntryFormContent({ isOpen, onClose, timesheetId, onSuccess, showToast }) {
  const [loading, setLoading] = useState(false);
  const [timesheet, setTimesheet] = useState(null);

  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    notes: '',
    billable: true,
    visitId: null,
  });

  useEffect(() => {
    if (isOpen && timesheetId) {
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
        const formattedDate = formatDateString(data.startDate);
        setFormData(prev => ({
          ...prev,
          date: formattedDate || prev.date,
        }));
      }
    } catch (err) {
      console.error('Error fetching timesheet:', err);
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

  const startDateStr = formatDateString(timesheet?.startDate);
  const endDateStr = formatDateString(timesheet?.endDate);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Manual Entry" size="md">
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

export default function TimesheetEntryForm(props) {
  const { showToast } = useToast();

  return (
    <ErrorBoundary>
      <TimesheetEntryFormContent {...props} showToast={showToast} />
    </ErrorBoundary>
  );
}