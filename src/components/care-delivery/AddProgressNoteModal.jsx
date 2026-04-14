'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

const NOTE_TYPES = [
  { value: 'SOAP', label: 'SOAP Note', description: 'Subjective, Objective, Assessment, Plan - Standard clinical documentation' },
  { value: 'DAP', label: 'DAP Note', description: 'Data, Assessment, Plan - Concise clinical format' },
  { value: 'NARRATIVE', label: 'Narrative', description: 'Free-form chronological documentation' },
  { value: 'INCIDENT', label: 'Incident Report', description: 'Document unexpected events or incidents' },
];

export default function AddProgressNoteModal({ clientId, existingNote, onClose, onSuccess }) {
  const [noteType, setNoteType] = useState(existingNote?.type || 'SOAP');
  const [visitId, setVisitId] = useState(existingNote?.visitId || '');
  const [subjective, setSubjective] = useState(existingNote?.subjective || '');
  const [objective, setObjective] = useState(existingNote?.objective || '');
  const [assessment, setAssessment] = useState(existingNote?.assessment || '');
  const [plan, setPlan] = useState(existingNote?.plan || '');
  const [narrative, setNarrative] = useState(existingNote?.narrative || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    // Validate based on note type
    if (noteType === 'SOAP') {
      if (!subjective && !objective && !assessment && !plan) {
        setError('Please fill in at least one SOAP section');
        return;
      }
    } else if (noteType === 'DAP' || noteType === 'NARRATIVE') {
      if (!narrative || !narrative.trim()) {
        setError('Please enter narrative content');
        return;
      }
    }

    setSubmitting(true);

    try {
      const data = {
        type: noteType,
        visitId: visitId || null,
      };

      if (noteType === 'SOAP') {
        data.subjective = subjective || null;
        data.objective = objective || null;
        data.assessment = assessment || null;
        data.plan = plan || null;
      } else {
        data.narrative = narrative || null;
      }

      const url = existingNote
        ? `/api/progress-notes/${existingNote.id}`
        : `/api/clients/${clientId}/progress-notes`;
      const method = existingNote ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const currentNoteType = NOTE_TYPES.find(nt => nt.value === noteType);

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
          maxWidth: '700px',
          maxHeight: '85vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {existingNote ? 'Edit Progress Note' : 'Add Progress Note'}
            </h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              {currentNoteType?.description}
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

        {/* Note Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
            Note Type *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {NOTE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setNoteType(type.value)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: noteType === type.value ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  backgroundColor: noteType === type.value ? 'var(--color-primary-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                  {type.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {type.description.substring(0, 50)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visit Link (optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
            Link to Visit (optional)
          </label>
          <input
            type="text"
            value={visitId}
            onChange={(e) => setVisitId(e.target.value)}
            placeholder="Enter visit ID or leave empty"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
            }}
          />
        </div>

        {/* SOAP Sections */}
        {noteType === 'SOAP' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Subjective (Patient&apos;s own words)
              </label>
              <textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="What does the patient report? Symptoms, complaints, feelings..."
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

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Objective (Observable findings)
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Vital signs, physical exam findings, observations..."
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

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Assessment (Clinical judgment)
              </label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Your clinical assessment and diagnosis..."
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

            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Plan (Next steps)
              </label>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Treatment plan, follow-up, patient education..."
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
          </div>
        )}

        {/* Narrative for DAP and Narrative types */}
        {(noteType === 'DAP' || noteType === 'NARRATIVE') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
              {noteType === 'DAP' ? 'DAP/Narrative Content' : 'Narrative Note'}
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Document your observations, assessments, and plan..."
              rows={8}
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
        )}

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
            {submitting ? 'Saving...' : (existingNote ? 'Update Note' : 'Save Note')}
          </button>
        </div>
      </div>
    </div>
  );
}
