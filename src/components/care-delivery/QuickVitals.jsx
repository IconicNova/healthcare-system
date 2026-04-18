'use client';

import { useState } from 'react';
import { Heart, Thermometer, Activity } from 'lucide-react';

export default function QuickVitals({ clientId, visitId, onComplete }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vitals, setVitals] = useState({
    temperature: '', heartRate: '', bloodPressureSystolic: '',
    bloodPressureDiastolic: '', oxygenSaturation: '',
  });

  const handleSave = async () => {
    setSaving(true);
    const data = {};
    Object.entries(vitals).forEach(([k, v]) => {
      data[k] = v ? parseFloat(v) : null;
    });

    try {
      const res = await fetch(`/api/clients/${clientId}/vitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, visitId }),
      });
      if (res.ok) {
        setOpen(false);
        setVitals({ temperature: '', heartRate: '', bloodPressureSystolic: '', bloodPressureDiastolic: '', oxygenSaturation: '' });
        onComplete?.();
      }
    } catch (err) {
      console.error('Error saving quick vitals:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title="Quick Vitals"
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--color-border)',
          backgroundColor: 'white', fontSize: '11px', fontWeight: 500,
          cursor: 'pointer', color: 'var(--color-text-secondary)',
        }}
      >
        <Heart size={12} /> Vitals
      </button>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{
      padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '10px',
      border: '1px solid var(--color-border)', marginTop: '8px',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        {[
          { key: 'temperature', label: 'Temp °F', icon: Thermometer },
          { key: 'heartRate', label: 'HR bpm', icon: Heart },
          { key: 'oxygenSaturation', label: 'SpO2 %', icon: Activity },
        ].map(v => (
          <div key={v.key}>
            <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{v.label}</label>
            <input
              type="number"
              value={vitals[v.key]}
              onChange={e => setVitals(prev => ({ ...prev, [v.key]: e.target.value }))}
              style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }}
            />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>BP Sys</label>
          <input type="number" value={vitals.bloodPressureSystolic} onChange={e => setVitals(prev => ({ ...prev, bloodPressureSystolic: e.target.value }))}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }} />
        </div>
        <div>
          <label style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>BP Dia</label>
          <input type="number" value={vitals.bloodPressureDiastolic} onChange={e => setVitals(prev => ({ ...prev, bloodPressureDiastolic: e.target.value }))}
            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13px' }} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={() => setOpen(false)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'white', fontSize: '12px', cursor: 'pointer' }}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-primary)', color: 'white', fontSize: '12px', cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
