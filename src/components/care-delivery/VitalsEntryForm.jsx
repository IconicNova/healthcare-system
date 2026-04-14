'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function VitalsEntryForm({ clientId, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    temperature: '',
    temperatureUnit: 'F',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    respiratoryRate: '',
    oxygenSaturation: '',
    painLevel: '',
    weight: '',
    weightUnit: 'lbs',
    height: '',
    heightUnit: 'in',
    glucose: '',
    glucoseUnit: 'mg/dL',
    notes: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    // Convert empty strings to null and parse numbers
    const data = {};
    Object.keys(formData).forEach(key => {
      const value = formData[key];
      if (value === '' || value === null) {
        data[key] = null;
      } else if (typeof value === 'string' && !value.includes(' ')) {
        data[key] = parseFloat(value) || null;
      } else {
        data[key] = value;
      }
    });

    // Validate pain level
    if (data.painLevel !== null && (data.painLevel < 0 || data.painLevel > 10)) {
      setError('Pain level must be between 0 and 10');
      return;
    }

    // Validate vital ranges
    const validations = [
      { field: 'temperature', min: -50, max: 150, label: 'Temperature' },
      { field: 'bloodPressureSystolic', min: 30, max: 300, label: 'Systolic BP' },
      { field: 'bloodPressureDiastolic', min: 20, max: 200, label: 'Diastolic BP' },
      { field: 'heartRate', min: 20, max: 300, label: 'Heart Rate' },
      { field: 'respiratoryRate', min: 4, max: 80, label: 'Respiratory Rate' },
      { field: 'oxygenSaturation', min: 50, max: 100, label: 'Oxygen Saturation' },
      { field: 'weight', min: 0, max: 1000, label: 'Weight' },
      { field: 'glucose', min: 20, max: 1000, label: 'Glucose' },
    ];

    for (const v of validations) {
      if (data[v.field] !== null && (data[v.field] < v.min || data[v.field] > v.max)) {
        setError(`${v.label} is out of reasonable range (${v.min}-${v.max})`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to record vitals');
      }
    } catch (error) {
      console.error('Error recording vitals:', error);
      setError('Failed to record vitals');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Record Vitals</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Enter patient vital signs
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              borderRadius: '8px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#FEF2F2',
            color: '#DC2626',
            fontSize: '13px',
            marginBottom: '16px',
          }}>
            {error}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {/* Temperature */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Temperature
            </label>
            <input
              type="number"
              step="0.1"
              value={formData.temperature}
              onChange={(e) => handleChange('temperature', e.target.value)}
              placeholder="98.6"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Heart Rate */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Heart Rate (bpm)
            </label>
            <input
              type="number"
              value={formData.heartRate}
              onChange={(e) => handleChange('heartRate', e.target.value)}
              placeholder="72"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Blood Pressure Systolic */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              BP Systolic (mmHg)
            </label>
            <input
              type="number"
              value={formData.bloodPressureSystolic}
              onChange={(e) => handleChange('bloodPressureSystolic', e.target.value)}
              placeholder="120"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Blood Pressure Diastolic */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              BP Diastolic (mmHg)
            </label>
            <input
              type="number"
              value={formData.bloodPressureDiastolic}
              onChange={(e) => handleChange('bloodPressureDiastolic', e.target.value)}
              placeholder="80"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Respiratory Rate */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Respiratory Rate (rpm)
            </label>
            <input
              type="number"
              value={formData.respiratoryRate}
              onChange={(e) => handleChange('respiratoryRate', e.target.value)}
              placeholder="16"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Oxygen Saturation */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              O2 Saturation (%)
            </label>
            <input
              type="number"
              value={formData.oxygenSaturation}
              onChange={(e) => handleChange('oxygenSaturation', e.target.value)}
              placeholder="98"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Pain Level */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Pain Level (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={formData.painLevel}
              onChange={(e) => handleChange('painLevel', e.target.value)}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Glucose */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Glucose (mg/dL)
            </label>
            <input
              type="number"
              value={formData.glucose}
              onChange={(e) => handleChange('glucose', e.target.value)}
              placeholder="100"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Weight */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Weight
            </label>
            <input
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              placeholder="150"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Height */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
              Height (inches)
            </label>
            <input
              type="number"
              value={formData.height}
              onChange={(e) => handleChange('height', e.target.value)}
              placeholder="68"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '4px' }}>
            Notes (optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Any additional observations..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              color: 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: submitting ? 'var(--color-gray-300)' : 'var(--color-primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? 'Saving...' : 'Save Vitals'}
          </button>
        </div>
      </div>
    </div>
  );
}
