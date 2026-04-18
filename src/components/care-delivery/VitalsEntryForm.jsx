'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { VITAL_RANGES, getVitalWarningMessage, isVitalWithinLimits } from '@/lib/vitals-config';

export default function VitalsEntryForm({ clientId, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);

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
    setWarnings([]);
    setShowWarningConfirm(false);
  };

  const validateAndSubmit = async (bypassWarnings = false) => {
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

    // BUG-01 FIX: Use clinical ranges from vitals-config
    const vitalFields = [
      'temperature', 'bloodPressureSystolic', 'bloodPressureDiastolic',
      'heartRate', 'respiratoryRate', 'oxygenSaturation', 'weight', 'glucose',
    ];

    // First pass: reject values outside absolute limits
    for (const field of vitalFields) {
      if (data[field] !== null && !isVitalWithinLimits(field, data[field])) {
        const config = VITAL_RANGES[field];
        setError(`${config?.label || field} of ${data[field]} is outside acceptable limits (${config?.min}-${config?.max}). Please verify and correct.`);
        return;
      }
    }

    // Second pass: warn about abnormal but possible values
    if (!bypassWarnings) {
      const newWarnings = [];
      for (const field of vitalFields) {
        if (data[field] !== null) {
          const msg = getVitalWarningMessage(field, data[field]);
          if (msg) {
            newWarnings.push(msg);
          }
        }
      }
      if (newWarnings.length > 0) {
        setWarnings(newWarnings);
        setShowWarningConfirm(true);
        return;
      }
    }

    // All validations passed — submit
    await doSubmit(data);
  };

  const handleSubmit = () => validateAndSubmit(false);
  const handleConfirmSubmit = () => validateAndSubmit(true);

  const doSubmit = async (data) => {
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

        {/* BUG-01 FIX: Warning confirmation for abnormal vitals */}
        {showWarningConfirm && warnings.length > 0 && (
          <div style={{
            padding: '16px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '12px',
            marginBottom: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={20} color="#F59E0B" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#B45309' }}>
                Abnormal Values Detected
              </span>
            </div>
            <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px', fontSize: '13px', color: '#92400E', lineHeight: 1.8 }}>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowWarningConfirm(false); setWarnings([]); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Go Back & Edit
              </button>
              <button
                onClick={handleConfirmSubmit}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#F59E0B',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                I Confirm — Save Anyway
              </button>
            </div>
          </div>
        )}

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
