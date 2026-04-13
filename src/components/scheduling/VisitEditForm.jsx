'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function VisitEditForm({ isOpen, onClose, onSubmit, visit, clients = [], staff = [], services = [], branches = [], carePlans = [], loading = false }) {
  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    serviceId: '',
    carePlanId: '',
    branchId: '',
    date: '',
    startTime: '',
    endTime: '',
    status: 'SCHEDULED',
    notes: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && visit) {
      const start = new Date(visit.startTime);
      const end = new Date(visit.endTime);

      setFormData({
        clientId: visit.clientId || '',
        staffId: visit.staffId || '',
        serviceId: visit.service?.id || '',
        carePlanId: visit.carePlanId || '',
        branchId: visit.branchId || '',
        date: start.toISOString().split('T')[0],
        startTime: start.toTimeString().slice(0, 5),
        endTime: end.toTimeString().slice(0, 5),
        status: visit.status || 'SCHEDULED',
        notes: visit.notes || '',
      });
      setErrors({});
    }
  }, [isOpen, visit]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.serviceId) {
      newErrors.serviceId = 'Service is required';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const startTime = new Date(`${formData.date}T${formData.startTime}`);
    const endTime = new Date(`${formData.date}T${formData.endTime}`);

    try {
      await onSubmit({
        clientId: formData.clientId,
        staffId: formData.staffId || null,
        serviceId: formData.serviceId,
        carePlanId: formData.carePlanId || null,
        branchId: formData.branchId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: formData.status,
        notes: formData.notes || null,
      });
      onClose();
    } catch (error) {
      console.error('Error updating visit:', error);
      alert('Failed to update visit');
    }
  };

  // Valid status transitions — mirrors the backend state machine
  const VALID_STATUS_TRANSITIONS = {
    VACANT: ['VACANT', 'SCHEDULED', 'OFFERED', 'CANCELLED'],
    SCHEDULED: ['SCHEDULED', 'IN_PROGRESS', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD', 'VACANT', 'OFFERED'],
    OFFERED: ['OFFERED', 'SCHEDULED', 'VACANT', 'CANCELLED'],
    IN_PROGRESS: ['IN_PROGRESS', 'COMPLETED', 'CLOCKED_IN', 'CANCELLED', 'ON_HOLD'],
    CLOCKED_IN: ['CLOCKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    COMPLETED: ['COMPLETED', 'APPROVED'],
    APPROVED: ['APPROVED'], // Terminal
    MISSED: ['MISSED', 'SCHEDULED'],
    LATE: ['LATE', 'IN_PROGRESS', 'CLOCKED_IN', 'COMPLETED', 'CANCELLED'],
    CANCELLED: ['CANCELLED'], // Terminal
    ON_HOLD: ['ON_HOLD', 'SCHEDULED', 'CANCELLED'],
    NO_SHOW: ['NO_SHOW', 'SCHEDULED'],
  };

  const ALL_STATUS_LABELS = {
    SCHEDULED: 'Scheduled',
    VACANT: 'Vacant',
    OFFERED: 'Offered',
    IN_PROGRESS: 'In Progress',
    CLOCKED_IN: 'Clocked In',
    COMPLETED: 'Completed',
    APPROVED: 'Approved',
    CANCELLED: 'Cancelled',
    ON_HOLD: 'On Hold',
    NO_SHOW: 'No Show',
    MISSED: 'Missed',
    LATE: 'Late',
  };

  // Get allowed statuses based on current visit status
  const currentStatus = visit?.status || 'SCHEDULED';
  const allowedStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [currentStatus];
  const statusOptions = allowedStatuses.map(s => ({
    value: s,
    label: ALL_STATUS_LABELS[s] || s,
  }));

  const clientOptions = [
    { value: '', label: 'Select Client' },
    ...clients.map(c => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName}${c.city ? ` — ${c.city}` : ''}`,
    })),
  ];

  const staffOptions = [
    { value: '', label: 'Unassigned (Vacant)' },
    ...staff.map(s => ({
      value: s.id,
      label: `${s.firstName} ${s.lastName}`,
    })),
  ];

  const serviceOptions = [
    { value: '', label: 'Select Service' },
    ...services.map(s => ({
      value: s.id,
      label: `${s.name} (${s.duration ? s.duration + ' min' : ''})`,
    })),
  ];

  const carePlanOptions = [
    { value: '', label: 'No Care Plan' },
    ...carePlans
      .filter(cp => cp.clientId === formData.clientId && cp.status !== false)
      .map(cp => ({
        value: cp.id,
        label: cp.name,
      })),
  ];

  // Check if selected staff matches care plan's assigned staff
  const getStaffMismatchHint = () => {
    if (!formData.carePlanId || !formData.staffId) return null;
    const cp = carePlans.find(c => c.id === formData.carePlanId);
    if (cp?.staffId && cp.staffId !== formData.staffId) {
      const cpStaff = staff.find(s => s.id === cp.staffId);
      if (cpStaff) {
        return `⚠️ Care plan primary staff is ${cpStaff.firstName} ${cpStaff.lastName}`;
      }
    }
    return null;
  };

  const branchOptions = [
    { value: '', label: 'Select Branch' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Select
              label="Client"
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              options={clientOptions}
              error={errors.clientId}
            />
          </div>

          <Select
            label="Staff"
            value={formData.staffId}
            onChange={(e) => handleInputChange('staffId', e.target.value)}
            options={staffOptions}
          />
          {getStaffMismatchHint() && (
            <p style={{ fontSize: '11px', color: '#D97706', margin: '4px 0 0 0', gridColumn: 'span 2' }}>
              {getStaffMismatchHint()}
            </p>
          )}

          <Select
            label="Service"
            value={formData.serviceId}
            onChange={(e) => handleInputChange('serviceId', e.target.value)}
            options={serviceOptions}
            error={errors.serviceId}
          />

          <Select
            label="Care Plan"
            value={formData.carePlanId}
            onChange={(e) => handleInputChange('carePlanId', e.target.value)}
            options={carePlanOptions}
          />

          <Select
            label="Branch"
            value={formData.branchId}
            onChange={(e) => handleInputChange('branchId', e.target.value)}
            options={branchOptions}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={statusOptions}
            error={errors.status}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
            min="1900-01-01"
          />

          <Input
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            error={errors.startTime}
          />

          <Input
            label="End Time"
            type="time"
            value={formData.endTime}
            onChange={(e) => handleInputChange('endTime', e.target.value)}
            error={errors.endTime}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows="3"
            className="textarea"
            placeholder="Optional notes for this visit..."
            maxLength={1000}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--color-border)',
        }}>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
