'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export default function VisitForm({ isOpen, onClose, onSubmit, clients = [], staff = [], services = [], branches = [], carePlans = [], loading = false }) {
  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    serviceId: '',
    carePlanId: '',
    branchId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    status: 'SCHEDULED',
    notes: '',
    recurrence: { type: 'NONE' },
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      clientId: '',
      staffId: '',
      serviceId: '',
      carePlanId: '',
      branchId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      status: 'SCHEDULED',
      notes: '',
      recurrence: { type: 'NONE' },
    });
    setErrors({});
  };

  // Map care plan frequency to visit recurrence type
  const frequencyToRecurrence = (frequency) => {
    const map = {
      'DAILY': 'DAILY',
      'WEEKLY': 'WEEKLY',
      'BI_WEEKLY': 'BI_WEEKLY',
      'MONTHLY': 'MONTHLY',
      'AS_NEEDED': 'NONE',
      'CUSTOM': 'NONE',
    };
    return map[frequency] || 'NONE';
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset care plan, staff, service, and notes when client changes
      if (field === 'clientId') {
        updated.carePlanId = '';
        updated.staffId = '';
        updated.serviceId = '';
        updated.recurrence = { type: 'NONE' };
        updated.notes = '';
      }
      // Auto-populate from care plan when selected, or reset when cleared
      if (field === 'carePlanId') {
        if (value) {
          const cp = carePlans.find(c => c.id === value);
          if (cp) {
            // Auto-fill client from care plan
            if (cp.clientId) {
              updated.clientId = cp.clientId;
            }
            // Auto-fill staff from care plan if available
            if (cp.staffId) {
              updated.staffId = cp.staffId;
            }
            // Auto-select the first service from the care plan
            if (cp?.services?.length > 0) {
              updated.serviceId = cp.services[0]?.serviceId || '';
              // Use the first service's frequency for recurrence
              const frequency = cp.services[0]?.frequency;
              if (frequency) {
                updated.recurrence = { type: frequencyToRecurrence(frequency) };
              }
            }
            // Copy care plan description to notes if notes is empty
            if (cp.description && !prev.notes) {
              updated.notes = cp.description;
            }
          }
        } else {
          // Reset when care plan is cleared
          updated.serviceId = '';
          updated.recurrence = { type: 'NONE' };
        }
      }
      // When service changes and a care plan is selected, match recurrence to that service's frequency
      if (field === 'serviceId' && prev.carePlanId) {
        const cp = carePlans.find(c => c.id === prev.carePlanId);
        const svc = cp?.services?.find(s => s.serviceId === value);
        if (svc?.frequency) {
          updated.recurrence = { type: frequencyToRecurrence(svc.frequency) };
        }
      }
      return updated;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleRecurrenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recurrence: { ...prev.recurrence, [field]: value },
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.serviceId) {
      newErrors.serviceId = 'Service is required';
    }
    if (!formData.branchId) {
      newErrors.branchId = 'Branch is required';
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
        recurrence: formData.recurrence.type === 'NONE' ? null : formData.recurrence,
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating visit:', error);
    }
  };

  if (!isOpen) return null;

  const statusOptions = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'VACANT', label: 'Vacant' },
    { value: 'OFFERED', label: 'Offered' },
    { value: 'ON_HOLD', label: 'On Hold' },
  ];

  const recurrenceOptions = [
    { value: 'NONE', label: 'No Recurrence' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BI_WEEKLY', label: 'Bi-Weekly (Every 2 Weeks)' },
    { value: 'MONTHLY', label: 'Monthly' },
  ];

  // Check if recurrence was auto-set from care plan
  const getRecurrenceHint = () => {
    if (!formData.carePlanId) return null;
    const cp = carePlans.find(c => c.id === formData.carePlanId);
    const selectedSvc = cp?.services?.find(s => s.serviceId === formData.serviceId);
    const frequency = selectedSvc?.frequency || cp?.services?.[0]?.frequency;
    if (frequency && frequency !== 'AS_NEEDED' && frequency !== 'CUSTOM') {
      return `Auto-set from care plan (${frequency.replace('_', '-').toLowerCase()})`;
    }
    return null;
  };

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

  // Get services from selected care plan, or show all if no care plan selected
  const selectedCarePlan = carePlans.find(cp => cp.id === formData.carePlanId);
  const carePlanServiceIds = selectedCarePlan?.services?.map(s => s.serviceId) || [];

  const filteredServices = formData.carePlanId && carePlanServiceIds.length > 0
    ? services.filter(s => carePlanServiceIds.includes(s.id))
    : services;

  const serviceOptions = [
    { value: '', label: 'Select Service' },
    ...filteredServices.map(s => ({
      value: s.id,
      label: `${s.name} (${s.duration ? s.duration + ' min' : ''})`,
    })),
  ];

  const branchOptions = [
    { value: '', label: 'Select Branch' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  const filteredCarePlans = carePlans.filter(cp => {
    // If client is selected, show only care plans for that client
    // If no client is selected, show all active care plans
    if (formData.clientId) {
      return cp.clientId === formData.clientId && (cp.status === true || cp.status === undefined);
    }
    return cp.status === true || cp.status === undefined;
  });

  const carePlanOptions = [
    { value: '', label: 'No Care Plan' },
    ...filteredCarePlans.map(cp => ({
      value: cp.id,
      label: `${cp.name} — ${cp.client?.firstName} ${cp.client?.lastName}`,
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 500,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Create Visit</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '50%' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
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
                <p style={{ fontSize: '11px', color: '#D97706', margin: '4px 0 0 0' }}>
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
                label="Branch"
                value={formData.branchId}
                onChange={(e) => handleInputChange('branchId', e.target.value)}
                options={branchOptions}
                error={errors.branchId}
              />

              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                options={statusOptions}
              />

              <Select
                label="Care Plan"
                value={formData.carePlanId}
                onChange={(e) => handleInputChange('carePlanId', e.target.value)}
                options={carePlanOptions}
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
              <Select
                label="Recurrence"
                value={formData.recurrence.type}
                onChange={(e) => handleRecurrenceChange('type', e.target.value)}
                options={recurrenceOptions}
              />
              {getRecurrenceHint() && (
                <p style={{ fontSize: '11px', color: 'var(--color-primary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                  ℹ️ {getRecurrenceHint()}
                </p>
              )}
            </div>

            {formData.recurrence.type === 'DAILY' && (
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Repeat for (days)"
                  type="number"
                  min="2"
                  max="365"
                  value={formData.recurrence.count || ''}
                  onChange={(e) => handleRecurrenceChange('count', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 10"
                />
              </div>
            )}

            {formData.recurrence.type === 'WEEKLY' && (
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Repeat for (weeks)"
                  type="number"
                  min="2"
                  max="52"
                  value={formData.recurrence.weeks || ''}
                  onChange={(e) => handleRecurrenceChange('weeks', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 4"
                />
              </div>
            )}

            {formData.recurrence.type === 'BI_WEEKLY' && (
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Repeat for (bi-weekly cycles)"
                  type="number"
                  min="2"
                  max="26"
                  value={formData.recurrence.count || ''}
                  onChange={(e) => handleRecurrenceChange('count', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 6"
                />
              </div>
            )}

            {formData.recurrence.type === 'MONTHLY' && (
              <div style={{ marginBottom: '16px' }}>
                <Input
                  label="Repeat for (months)"
                  type="number"
                  min="2"
                  max="12"
                  value={formData.recurrence.count || ''}
                  onChange={(e) => handleRecurrenceChange('count', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3"
                />
              </div>
            )}

            <div>
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
          </form>
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            Create Visit
          </Button>
        </div>
      </div>
    </div>
  );
}