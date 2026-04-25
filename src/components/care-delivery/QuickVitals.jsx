'use client';

import { useState } from 'react';
import { Heart, Thermometer, Activity, AlertTriangle } from 'lucide-react';
import { VITAL_RANGES, getVitalWarningMessage, isVitalWithinLimits } from '@/lib/vitals-config';

const QUICK_VITAL_FIELDS = [
  'temperature',
  'heartRate',
  'respiratoryRate',
  'oxygenSaturation',
  'bloodPressureSystolic',
  'bloodPressureDiastolic',
];

export default function QuickVitals({ clientId, visitId, onComplete }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: '',
    respiratoryRate: '',
    heartRate: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    oxygenSaturation: '',
  });

  const resetWarnings = () => {
    setWarnings([]);
    setShowWarningConfirm(false);
  };

  const handleChange = (field, value) => {
    setVitals((prev) => ({ ...prev, [field]: value }));
    setError('');
    resetWarnings();
  };

  const buildPayload = () => {
    const data = {};
    Object.entries(vitals).forEach(([key, value]) => {
      data[key] = value === '' || value === null ? null : parseFloat(value);
    });
    return data;
  };

  const submitVitals = async (data) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, visitId }),
      });

      if (response.ok) {
        setOpen(false);
        setVitals({
          temperature: '',
          respiratoryRate: '',
          heartRate: '',
          bloodPressureSystolic: '',
          bloodPressureDiastolic: '',
          oxygenSaturation: '',
        });
        resetWarnings();
        setError('');
        onComplete?.();
        return;
      }

      const errorData = await response.json().catch(() => ({}));
      setError(errorData.error || 'Failed to record vitals');
    } catch (err) {
      console.error('Error saving quick vitals:', err);
      setError('Failed to record vitals');
    } finally {
      setSaving(false);
    }
  };

  const validateAndSave = async (bypassWarnings = false) => {
    const data = buildPayload();
    const warningsNext = [];

    for (const field of QUICK_VITAL_FIELDS) {
      if (data[field] !== null && !isVitalWithinLimits(field, data[field])) {
        const config = VITAL_RANGES[field];
        setError(
          `${config?.label || field} of ${data[field]} is outside acceptable limits (${config?.min}-${config?.max}). Please verify and correct.`
        );
        return;
      }

      if (data[field] !== null) {
        const warning = getVitalWarningMessage(field, data[field]);
        if (warning) warningsNext.push(warning);
      }
    }

    if (!bypassWarnings && warningsNext.length > 0) {
      setWarnings(warningsNext);
      setShowWarningConfirm(true);
      return;
    }

    await submitVitals(data);
  };

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setError('');
          resetWarnings();
          setOpen(true);
        }}
        title="Quick Vitals"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'white',
          fontSize: '11px',
          fontWeight: 500,
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Heart size={12} /> Vitals
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: '12px',
        backgroundColor: '#F8FAFC',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        marginTop: '8px',
      }}
    >
      {error && (
        <div
          style={{
            marginBottom: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #FCA5A5',
            backgroundColor: '#FEF2F2',
            color: '#B91C1C',
            fontSize: '12px',
            lineHeight: 1.5,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '8px' }}>
        {[
          { key: 'temperature', label: 'Temp F', icon: Thermometer, step: '0.1' },
          { key: 'heartRate', label: 'HR bpm', icon: Heart },
          { key: 'respiratoryRate', label: 'Resp bpm', icon: Activity },
          { key: 'oxygenSaturation', label: 'SpO2 %', icon: Activity },
        ].map((v) => (
          <div key={v.key}>
            <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{v.label}</label>
            <input
              type="number"
              step={v.step}
              value={vitals[v.key]}
              onChange={(e) => handleChange(v.key, e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>BP Sys</label>
          <input
            type="number"
            value={vitals.bloodPressureSystolic}
            onChange={(e) => handleChange('bloodPressureSystolic', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>BP Dia</label>
          <input
            type="number"
            value={vitals.bloodPressureDiastolic}
            onChange={(e) => handleChange('bloodPressureDiastolic', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          />
        </div>
      </div>

      {showWarningConfirm && warnings.length > 0 && (
        <div
          style={{
            marginBottom: '10px',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #FDE68A',
            backgroundColor: '#FFFBEB',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <AlertTriangle size={16} color="#B45309" />
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>Abnormal vitals detected</div>
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#92400E', lineHeight: 1.6 }}>
            {warnings.map((warning, index) => (
              <li key={`${index}-${warning}`}>{warning}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              onClick={() => {
                resetWarnings();
              }}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Edit
            </button>
            <button
              onClick={() => validateAndSave(true)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#F59E0B',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Confirm and Save
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          onClick={() => {
            setOpen(false);
            setError('');
            resetWarnings();
          }}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'white',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => validateAndSave(false)}
          disabled={saving}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontSize: '12px',
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
