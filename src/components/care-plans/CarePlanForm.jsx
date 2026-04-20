'use client';

import { useState, useEffect } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export default function CarePlanForm({ isOpen, onClose, onSubmit, clients = [], staff = [], services = [], carePlan = null, loading = false }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 16),
    endDate: '',
    status: true,
    clientId: '',
    staffId: '',
    serviceIds: [],
    serviceDetails: [],
  });
  const [errors, setErrors] = useState({});
  const [minDateTime, setMinDateTime] = useState('');

  useEffect(() => {
    // Set minimum datetime to current date/time (prevent past dates)
    const now = new Date();
    setMinDateTime(now.toISOString().slice(0, 16));
  }, []);

  useEffect(() => {
    if (carePlan) {
      setFormData({
        name: carePlan.name || '',
        description: carePlan.description || '',
        startDate: carePlan.startDate ? new Date(carePlan.startDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        endDate: carePlan.endDate ? new Date(carePlan.endDate).toISOString().slice(0, 16) : '',
        status: carePlan.status ?? true,
        clientId: carePlan.clientId || '',
        staffId: carePlan.staffId || '',
        serviceIds: carePlan.services?.map(s => s.serviceId) || [],
        serviceDetails: carePlan.services || [],
      });
    } else if (isOpen) {
      resetForm();
    }
  }, [carePlan, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 16),
      endDate: '',
      status: true,
      clientId: '',
      staffId: '',
      serviceIds: [],
      serviceDetails: [],
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      serviceDetails: [...prev.serviceDetails, { serviceId: '', frequency: 'DAILY', instructions: '', order: prev.serviceDetails.length }],
    }));
  };

  const updateService = (index, field, value) => {
    // Check for duplicate services when changing serviceId
    if (field === 'serviceId' && value) {
      const isDuplicate = formData.serviceDetails.some(
        (s, i) => i !== index && s.serviceId === value
      );
      if (isDuplicate) {
        alert('This service has already been added to the care plan. Please select a different service.');
        return;
      }
    }
    const updated = [...formData.serviceDetails];
    updated[index] = { ...updated[index], [field]: value };
    setFormData(prev => ({ ...prev, serviceDetails: updated }));
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceDetails: prev.serviceDetails.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Care plan name is required';
    }
    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }
    if (formData.endDate && formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (formData.serviceDetails.length === 0) {
      newErrors.services = 'At least one service is required';
    }
    // Validate each service row has a non-empty serviceId
    const emptyServiceRows = formData.serviceDetails.filter(s => !s.serviceId);
    if (emptyServiceRows.length > 0 && formData.serviceDetails.length > 0) {
      newErrors.services = 'All service rows must have a service selected';
    }
    // Check for duplicate services
    const serviceIds = formData.serviceDetails.map(s => s.serviceId).filter(Boolean);
    const uniqueServiceIds = new Set(serviceIds);
    if (uniqueServiceIds.size !== serviceIds.length) {
      newErrors.services = 'Duplicate services are not allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        status: formData.status,
        clientId: formData.clientId,
        staffId: formData.staffId || null,
        services: formData.serviceDetails.map(s => ({
          serviceId: s.serviceId,
          frequency: s.frequency,
          frequencyText: s.frequencyText || null,
          instructions: s.instructions || null,
          order: s.order,
        })),
      };

      await onSubmit(payload);
      if (!carePlan) {
        resetForm();
      }
      onClose();
    } catch (error) {
      console.error('Error saving care plan:', error);
      alert('Failed to save care plan');
    }
  };

  const frequencyOptions = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'AS_NEEDED', label: 'As Needed' },
    { value: 'CUSTOM', label: 'Custom' },
  ];

  const clientOptions = [
    { value: '', label: 'Select Client' },
    ...clients
      .filter(c => !c.status || c.status === 'ACTIVE' || c.status === 'PENDING')
      .map(c => ({
        value: c.id,
        label: `${c.firstName} ${c.lastName}${c.city ? ` — ${c.city}` : ''}`,
      })),
  ];

  const staffOptions = [
    { value: '', label: 'Select Primary Staff (Optional)' },
    ...staff
      .filter(s => s.status === 'ACTIVE')
      .map(s => ({
        value: s.id,
        label: `${s.firstName} ${s.lastName} (${s.role})`,
      })),
  ];

  const serviceOptions = [
    { value: '', label: 'Select Service' },
    ...services.map(s => ({
      value: s.id,
      label: `${s.name} (${s.duration ? s.duration + ' min' : ''}) - $${s.baseRate}`,
    })),
  ];

  if (!isOpen) return null;

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      <div>
        <Input
          label="Care Plan Name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g., Post-Surgery Recovery Plan"
          error={errors.name}
          maxLength={255}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows="3"
          className="textarea"
          placeholder="Optional description of the care plan..."
          maxLength={1000}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Select
          label="Client"
          value={formData.clientId}
          onChange={(e) => handleInputChange('clientId', e.target.value)}
          options={clientOptions}
          error={errors.clientId}
        />

        <Select
          label="Primary Staff"
          value={formData.staffId}
          onChange={(e) => handleInputChange('staffId', e.target.value)}
          options={staffOptions}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <Input
          label="Start Date"
          type="datetime-local"
          value={formData.startDate}
          onChange={(e) => handleInputChange('startDate', e.target.value)}
          error={errors.startDate}
          min={minDateTime}
        />

        <Input
          label="End Date (Optional)"
          type="datetime-local"
          value={formData.endDate}
          onChange={(e) => handleInputChange('endDate', e.target.value)}
          error={errors.endDate}
          min={minDateTime}
        />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500 }}>Services *</label>
          <button
            type="button"
            onClick={addService}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px dashed var(--color-border)',
              backgroundColor: 'white',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            + Add Service
          </button>
        </div>

        {errors.services && (
          <div style={{ color: 'var(--color-error)', fontSize: '12px', marginBottom: '8px' }}>{errors.services}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {formData.serviceDetails.map((service, index) => (
            <div
              key={index}
              style={{
                padding: '16px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--color-gray-50)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 2fr 1fr', gap: '12px', alignItems: 'end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Service *</label>
                  <select
                    value={service.serviceId}
                    onChange={(e) => updateService(index, 'serviceId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  >
                    {serviceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Frequency</label>
                  <select
                    value={service.frequency}
                    onChange={(e) => updateService(index, 'frequency', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  >
                    {frequencyOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Instructions</label>
                  <input
                    type="text"
                    value={service.instructions || ''}
                    onChange={(e) => updateService(index, 'instructions', e.target.value)}
                    placeholder="Special instructions..."
                    maxLength={1000}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-error)',
                      backgroundColor: 'white',
                      color: 'var(--color-error)',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" onClick={handleSubmit} loading={loading}>
          {carePlan ? 'Update Care Plan' : 'Create Care Plan'}
        </Button>
      </div>
    </div>
  );
}
