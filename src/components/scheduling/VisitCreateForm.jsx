'use client';

import { useEffect, useState } from 'react';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import {
  buildVisitCreateFormState,
  CREATE_VISIT_STATUSES,
  formatRecurrenceSummary,
  getCarePlanStaffWarning,
  getVisitStatusLabel,
  validateRecurrence,
} from '@/lib/scheduling';

function mapFrequencyToRecurrence(frequency) {
  const map = {
    DAILY: { type: 'DAILY', count: 2 },
    WEEKLY: { type: 'WEEKLY', weeks: 2 },
    BI_WEEKLY: { type: 'BI_WEEKLY', count: 2 },
    MONTHLY: { type: 'MONTHLY', count: 2 },
  };

  return map[frequency] || { type: 'NONE' };
}

export default function VisitCreateForm({
  isOpen,
  onClose,
  onSubmit,
  initialValues = null,
  clients = [],
  staff = [],
  services = [],
  branches = [],
  carePlans = [],
  loading = false,
}) {
  const [formData, setFormData] = useState(() => buildVisitCreateFormState(initialValues || {}));
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(buildVisitCreateFormState(initialValues || {}));
      setErrors({});
      setSubmitError('');
    }
  }, [initialValues, isOpen]);

  const selectedCarePlan = carePlans.find((carePlan) => carePlan.id === formData.carePlanId) || null;
  const carePlanServiceIds = selectedCarePlan?.services?.map((service) => service.serviceId) || [];
  const filteredServices =
    selectedCarePlan && carePlanServiceIds.length > 0
      ? services.filter((service) => carePlanServiceIds.includes(service.id))
      : services;
  const staffMismatchWarning = getCarePlanStaffWarning({
    carePlan: selectedCarePlan,
    staffId: formData.staffId,
    staffRecords: staff,
  });
  const recurrenceSummary = formatRecurrenceSummary({
    date: formData.date,
    recurrence: formData.recurrence,
  });
  const carePlanBranch = branches.find((branch) => branch.id === selectedCarePlan?.branchId) || null;
  const branchMismatch =
    selectedCarePlan?.branchId && formData.branchId && selectedCarePlan.branchId !== formData.branchId
      ? `This care plan belongs to ${carePlanBranch?.name || 'another branch'}.`
      : null;

  const handleInputChange = (field, value) => {
    setSubmitError('');
    setFormData((currentValue) => {
      const nextValue = { ...currentValue, [field]: value };

      if (field === 'clientId') {
        nextValue.carePlanId = '';
        nextValue.recurrence = { type: 'NONE' };
      }

      if (field === 'carePlanId') {
        if (!value) {
          nextValue.recurrence = { type: 'NONE' };
        } else {
          const nextCarePlan = carePlans.find((carePlan) => carePlan.id === value);
          const matchingService = nextCarePlan?.services?.find((service) => service.serviceId === currentValue.serviceId);
          const recurrenceSource = matchingService?.frequency || nextCarePlan?.services?.[0]?.frequency;
          nextValue.recurrence = mapFrequencyToRecurrence(recurrenceSource);

          if (nextCarePlan?.branchId && !currentValue.branchId) {
            nextValue.branchId = nextCarePlan.branchId;
          }
        }
      }

      if (field === 'serviceId' && currentValue.carePlanId) {
        const carePlan = carePlans.find((item) => item.id === currentValue.carePlanId);
        const matchedService = carePlan?.services?.find((service) => service.serviceId === value);
        if (matchedService?.frequency) {
          nextValue.recurrence = mapFrequencyToRecurrence(matchedService.frequency);
        }
      }

      if (field === 'status' && value === 'VACANT') {
        nextValue.staffId = '';
      }

      if (field === 'staffId' && value && currentValue.status === 'VACANT') {
        nextValue.status = 'SCHEDULED';
      }

      return nextValue;
    });

    setErrors((currentValue) => ({ ...currentValue, [field]: null, recurrence: null }));
  };

  const handleRecurrenceChange = (field, value) => {
    setSubmitError('');
    setFormData((currentValue) => ({
      ...currentValue,
      recurrence: {
        ...currentValue.recurrence,
        [field]: value,
      },
    }));
    setErrors((currentValue) => ({ ...currentValue, recurrence: null }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.clientId) {
      nextErrors.clientId = 'Client is required';
    }
    if (!formData.serviceId) {
      nextErrors.serviceId = 'Service is required';
    }
    if (!formData.branchId) {
      nextErrors.branchId = 'Branch is required';
    }
    if (!formData.date) {
      nextErrors.date = 'Date is required';
    }
    if (!formData.startTime) {
      nextErrors.startTime = 'Start time is required';
    }
    if (!formData.endTime) {
      nextErrors.endTime = 'End time is required';
    }
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      nextErrors.endTime = 'End time must be after start time';
    }

    const recurrenceError = validateRecurrence(formData.recurrence);
    if (recurrenceError) {
      nextErrors.recurrence = recurrenceError;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    const startDate = new Date(formData.date);
    const endDate = new Date(formData.date);
    const startTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHour, startMinute, 0, 0);
    const endTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHour, endMinute, 0, 0);

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

      setFormData(buildVisitCreateFormState(initialValues || {}));
      setErrors({});
      setSubmitError('');
      onClose();
    } catch (error) {
      setSubmitError(error.message || 'Visit could not be created.');
    }
  };

  const statusOptions = CREATE_VISIT_STATUSES.map((status) => ({
    value: status,
    label: getVisitStatusLabel(status),
  }));
  const recurrenceOptions = [
    { value: 'NONE', label: 'No Recurrence' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'BI_WEEKLY', label: 'Bi-Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
  ];
  const clientOptions = [
    { value: '', label: 'Select Client' },
    ...clients.map((client) => ({
      value: client.id,
      label: `${client.firstName} ${client.lastName}${client.city ? ` - ${client.city}` : ''}`,
    })),
  ];
  const staffOptions = [
    { value: '', label: 'Unassigned' },
    ...staff.map((member) => ({
      value: member.id,
      label: `${member.firstName} ${member.lastName}`,
    })),
  ];
  const serviceOptions = [
    { value: '', label: 'Select Service' },
    ...filteredServices.map((service) => ({
      value: service.id,
      label: `${service.name}${service.duration ? ` (${service.duration} min)` : ''}`,
    })),
  ];
  const branchOptions = [
    { value: '', label: 'Select Branch' },
    ...branches.map((branch) => ({ value: branch.id, label: branch.name })),
  ];
  const carePlanOptions = [
    { value: '', label: 'No Care Plan' },
    ...carePlans
      .filter((carePlan) => carePlan.clientId === formData.clientId && carePlan.status !== false)
      .map((carePlan) => ({
        value: carePlan.id,
        label: carePlan.name,
      })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Visit" size="lg">
      <form onSubmit={handleSubmit}>
        {submitError ? (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2',
              color: '#B91C1C',
              fontSize: '13px',
            }}
          >
            {submitError}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <Select
              label="Client"
              value={formData.clientId}
              onChange={(event) => handleInputChange('clientId', event.target.value)}
              options={clientOptions}
              error={errors.clientId}
            />
          </div>

          <div>
            <Select
              label="Staff"
              value={formData.staffId}
              onChange={(event) => handleInputChange('staffId', event.target.value)}
              options={staffOptions}
            />
            {formData.status === 'VACANT' ? (
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                Vacant visits stay unassigned until a scheduler changes the status.
              </p>
            ) : null}
          </div>

          <div>
            <Select
              label="Service"
              value={formData.serviceId}
              onChange={(event) => handleInputChange('serviceId', event.target.value)}
              options={serviceOptions}
              error={errors.serviceId}
            />
          </div>

          <Select
            label="Branch"
            value={formData.branchId}
            onChange={(event) => handleInputChange('branchId', event.target.value)}
            options={branchOptions}
            error={errors.branchId}
          />

          <Select
            label="Status"
            value={formData.status}
            onChange={(event) => handleInputChange('status', event.target.value)}
            options={statusOptions}
          />

          <Select
            label="Care Plan"
            value={formData.carePlanId}
            onChange={(event) => handleInputChange('carePlanId', event.target.value)}
            options={carePlanOptions}
          />
        </div>

        {staffMismatchWarning ? (
          <p style={{ fontSize: '12px', color: '#B45309', margin: '0 0 12px 0' }}>{staffMismatchWarning}</p>
        ) : null}

        {branchMismatch ? (
          <p style={{ fontSize: '12px', color: '#B45309', margin: '0 0 12px 0' }}>{branchMismatch}</p>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <Input
            label="Date"
            type="date"
            value={formData.date}
            onChange={(event) => handleInputChange('date', event.target.value)}
            error={errors.date}
            min="1900-01-01"
          />
          <Input
            label="Start Time"
            type="time"
            value={formData.startTime}
            onChange={(event) => handleInputChange('startTime', event.target.value)}
            error={errors.startTime}
          />
          <Input
            label="End Time"
            type="time"
            value={formData.endTime}
            onChange={(event) => handleInputChange('endTime', event.target.value)}
            error={errors.endTime}
          />
        </div>

        <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--color-gray-50)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
            <Select
              label="Recurrence"
              value={formData.recurrence.type}
              onChange={(event) => handleRecurrenceChange('type', event.target.value)}
              options={recurrenceOptions}
            />

            {formData.recurrence.type !== 'NONE' ? (
              <Input
                label={formData.recurrence.type === 'WEEKLY' ? 'Total Weeks' : 'Total Visits'}
                type="number"
                min="2"
                value={
                  formData.recurrence.type === 'WEEKLY'
                    ? formData.recurrence.weeks || ''
                    : formData.recurrence.count || ''
                }
                onChange={(event) =>
                  handleRecurrenceChange(
                    formData.recurrence.type === 'WEEKLY' ? 'weeks' : 'count',
                    Number.parseInt(event.target.value, 10) || ''
                  )
                }
                placeholder="Minimum 2"
              />
            ) : null}
          </div>

          {selectedCarePlan?.services?.length ? (
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '8px 0 0 0' }}>
              Recurrence defaults to the selected care plan frequency when available.
            </p>
          ) : null}

          {recurrenceSummary ? (
            <p style={{ fontSize: '12px', color: 'var(--color-text)', margin: '10px 0 0 0' }}>{recurrenceSummary}</p>
          ) : null}

          {errors.recurrence ? (
            <p style={{ fontSize: '12px', color: '#DC2626', margin: '8px 0 0 0' }}>{errors.recurrence}</p>
          ) : null}
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px' }}>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(event) => handleInputChange('notes', event.target.value)}
            rows="3"
            className="textarea"
            placeholder="Optional notes for this visit..."
            maxLength={1000}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Visit
          </Button>
        </div>
      </form>
    </Modal>
  );
}
