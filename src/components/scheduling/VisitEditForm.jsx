'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
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

  const statusOptions = [
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'NO_SHOW', label: 'No Show' },
    { value: 'MISSSED', label: 'Missed' },
  ];

  const clientOptions = [
    { value: '', label: 'Select Client' },
    ...clients.map(c => ({
      value: c.id,
      label: `${c.firstName} ${c.lastName} - ${c.city}`,
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

  const branchOptions = [
    { value: '', label: 'Select Branch' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  const carePlanOptions = [
    { value: '', label: 'No Care Plan' },
    ...carePlans.filter(cp => cp.clientId === formData.clientId).map(cp => ({
      value: cp.id,
      label: `${cp.name} (${cp.status})`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Visit" size="lg">
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Select
              label="Client *"
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

          <Select
            label="Service *"
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
            label="Status *"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={statusOptions}
            error={errors.status}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Input
            label="Date *"
            type="date"
            value={formData.date}
            onChange={(e) => handleInputChange('date', e.target.value)}
            error={errors.date}
          />

          <Input
            label="Start Time *"
            type="time"
            value={formData.startTime}
            onChange={(e) => handleInputChange('startTime', e.target.value)}
            error={errors.startTime}
          />

          <Input
            label="End Time *"
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
