'use client';

import { useState, useEffect } from 'react';

export default function TimesheetEntryForm({ isOpen, onClose, timesheetId, onSuccess }) {
  console.log('Rendering TimesheetEntryForm', { isOpen, timesheetId });

  const [loading, setLoading] = useState(false);
  const [timesheet, setTimesheet] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    hours: '',
    notes: '',
    billable: true,
    visitId: null,
  });

  console.log('TimesheetEntryForm state', { loading, timesheet, error, formData });

  useEffect(() => {
    console.log('useEffect running', { isOpen, timesheetId });
    if (isOpen && timesheetId) {
      console.log('Fetching timesheet...');
      fetchTimesheet();
    }
  }, [isOpen, timesheetId]);

  const formatDateString = (dateValue) => {
    console.log('formatDateString input:', dateValue);
    if (!dateValue) return '';
    try {
      const d = new Date(dateValue);
      console.log('Parsed date:', d);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      console.error('formatDateString error:', e);
      return '';
    }
  };

  const fetchTimesheet = async () => {
    try {
      console.log('fetchTimesheet called with timesheetId:', timesheetId);
      const response = await fetch(`/api/payroll/timesheets/${timesheetId}`);
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      console.log('Response data:', data);
      setTimesheet(data);
      if (data.startDate) {
        const formattedDate = formatDateString(data.startDate);
        console.log('Setting form date to:', formattedDate);
        setFormData(prev => ({
          ...prev,
          date: formattedDate,
        }));
      }
    } catch (err) {
      console.error('Error fetching timesheet:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hours = parseFloat(formData.hours);
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter valid hours');
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
        alert('Entry added successfully');
        onSuccess();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add entry');
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      alert('Failed to add entry');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    console.log('Not rendering - isOpen is false');
    return null;
  }

  console.log('Rendering modal with form');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%'
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Add Manual Entry</h3>
        
        {error && (
          <div style={{ color: 'red', marginBottom: '16px' }}>Error: {error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Date *</label>
            <input
              type="date"
              style={{ width: '100%', padding: '8px' }}
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Hours *</label>
            <input
              type="number"
              step="0.25"
              min="0"
              style={{ width: '100%', padding: '8px' }}
              value={formData.hours}
              onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
              placeholder="0.00"
              required
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px' }}>Description</label>
            <input
              type="text"
              style={{ width: '100%', padding: '8px' }}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="e.g., Admin time, Training, Travel"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>
              <input
                type="checkbox"
                checked={formData.billable}
                onChange={(e) => setFormData(prev => ({ ...prev, billable: e.target.checked }))}
              />
              {' '}Billable
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>
              {loading ? 'Adding...' : 'Add Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}