'use client';

import { useState } from 'react';
import { ArrowRightLeft, AlertTriangle, Check, X } from 'lucide-react';

export default function MedicationReconciliation({ clientId, currentMedications, onClose, onSuccess }) {
  const [externalMedications, setExternalMedications] = useState([]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedFrequency, setNewMedFrequency] = useState('');
  const [comparison, setComparison] = useState(null);
  const [processing, setProcessing] = useState(false);

  const addExternalMedication = () => {
    if (!newMedName.trim()) return;

    setExternalMedications(prev => [...prev, {
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFrequency.trim(),
    }]);

    setNewMedName('');
    setNewMedDosage('');
    setNewMedFrequency('');
  };

  const removeExternalMedication = (index) => {
    setExternalMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleCompare = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/medications/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalMedications,
          action: 'compare',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComparison(data.comparison);
      }
    } catch (error) {
      console.error('Error comparing medications:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleMerge = async () => {
    setProcessing(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/medications/reconcile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalMedications,
          action: 'merge',
        }),
      });

      if (response.ok) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error merging medications:', error);
    } finally {
      setProcessing(false);
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
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              Medication Reconciliation
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Compare and merge medication lists
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
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Current Medications */}
        <div style={{ marginBottom: '20px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
            Current Medications in System
          </h5>
          {currentMedications?.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>No medications on file</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {currentMedications?.map((med, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'var(--color-gray-100)',
                    fontSize: '13px',
                  }}
                >
                  {med.name} ({med.dosage})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add External Medications */}
        <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: 'var(--color-gray-50)', borderRadius: '12px' }}>
          <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
            Add External Medications (from hospital, new prescription, etc.)
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              placeholder="Medication Name"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
            <input
              type="text"
              placeholder="Dosage"
              value={newMedDosage}
              onChange={(e) => setNewMedDosage(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
            <input
              type="text"
              placeholder="Frequency"
              value={newMedFrequency}
              onChange={(e) => setNewMedFrequency(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
              }}
            />
            <button
              onClick={addExternalMedication}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Add
            </button>
          </div>

          {externalMedications.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                EXTERNAL LIST ({externalMedications.length}):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {externalMedications.map((med, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <span style={{ fontSize: '13px' }}>
                      {med.name} {med.dosage && `(${med.dosage})`} {med.frequency && `@ ${med.frequency}`}
                    </span>
                    <button
                      onClick={() => removeExternalMedication(idx)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={processing || externalMedications.length === 0}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: (processing || externalMedications.length === 0) ? 'var(--color-gray-300)' : 'var(--color-primary)',
            color: 'white',
            fontSize: '14px',
            fontWeight: 500,
            cursor: (processing || externalMedications.length === 0) ? 'not-allowed' : 'pointer',
            opacity: (processing || externalMedications.length === 0) ? 0.6 : 1,
            marginBottom: '20px',
          }}
        >
          <ArrowRightLeft size={16} style={{ display: 'inline', marginRight: '8px' }} />
          {processing ? 'Comparing...' : 'Compare Lists'}
        </button>

        {/* Comparison Results */}
        {comparison && (
          <div style={{ padding: '16px', backgroundColor: 'var(--color-gray-50)', borderRadius: '12px' }}>
            <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
              Comparison Results
            </h5>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#DEF7EC', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#03543F' }}>{comparison.added}</div>
                <div style={{ fontSize: '11px', color: '#03543F', textTransform: 'uppercase' }}>New</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#FDE8E8', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#9B1C1C' }}>{comparison.discontinued}</div>
                <div style={{ fontSize: '11px', color: '#9B1C1C', textTransform: 'uppercase' }}>Discontinued</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', backgroundColor: '#DEF7EC', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#03543F' }}>{comparison.unchanged}</div>
                <div style={{ fontSize: '11px', color: '#03543F', textTransform: 'uppercase' }}>Unchanged</div>
              </div>
            </div>

            {comparison.details?.potentiallyChanged?.length > 0 && (
              <div style={{ padding: '12px', backgroundColor: '#FEF3C7', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <AlertTriangle size={16} style={{ color: '#92400E' }} />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#92400E' }}>
                    {comparison.details.potentiallyChanged.length} medication(s) with changes
                  </span>
                </div>
                {comparison.details.potentiallyChanged.map((item, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#92400E', marginTop: '4px' }}>
                    - {item.medication.name}: {item.changes.map(c => `${c.field} changed from "${c.old}" to "${c.new}"`).join(', ')}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleMerge}
              disabled={processing}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: processing ? 'var(--color-gray-300)' : '#03543F',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: processing ? 'not-allowed' : 'pointer',
                opacity: processing ? 0.6 : 1,
              }}
            >
              <Check size={16} style={{ display: 'inline', marginRight: '8px' }} />
              {processing ? 'Merging...' : 'Merge External List'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
