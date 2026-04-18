'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, AlertTriangle } from 'lucide-react';

const NOTE_TYPES = [
  { value: 'SOAP', label: 'SOAP Note', description: 'Subjective, Objective, Assessment, Plan - Standard clinical documentation' },
  { value: 'DAP', label: 'DAP Note', description: 'Data, Assessment, Plan - Concise clinical format' },
  { value: 'NARRATIVE', label: 'Narrative', description: 'Free-form chronological documentation' },
  { value: 'INCIDENT', label: 'Incident Report', description: 'Document unexpected events or incidents' },
];

const INCIDENT_SEVERITIES = [
  { value: 'LOW', label: 'Low', color: '#3B82F6' },
  { value: 'MODERATE', label: 'Moderate', color: '#F59E0B' },
  { value: 'HIGH', label: 'High', color: '#EF4444' },
  { value: 'CRITICAL', label: 'Critical', color: '#DC2626' },
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

  // BUG-10 FIX: Fetch client visits for dropdown instead of requiring raw UUID
  const [clientVisits, setClientVisits] = useState([]);
  const [visitsLoading, setVisitsLoading] = useState(false);

  // BUG-16 FIX: Incident-specific fields
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentLocation, setIncidentLocation] = useState('');
  const [incidentPeopleInvolved, setIncidentPeopleInvolved] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState('LOW');
  const [incidentActionsTaken, setIncidentActionsTaken] = useState('');

  useEffect(() => {
    if (clientId) {
      setVisitsLoading(true);
      fetch(`/api/clients/${clientId}/visits`)
        .then(res => res.ok ? res.json() : { visits: [] })
        .then(data => setClientVisits(data.visits || []))
        .catch(() => setClientVisits([]))
        .finally(() => setVisitsLoading(false));
    }
  }, [clientId]);

  const handleSubmit = async () => {
    setError('');

    // BUG-14 FIX: Validate based on note type including INCIDENT
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
    } else if (noteType === 'INCIDENT') {
      if (!narrative || !narrative.trim()) {
        setError('Please describe the incident');
        return;
      }
      if (!incidentDate) {
        setError('Please enter the incident date and time');
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
      } else if (noteType === 'INCIDENT') {
        // Pack incident details into narrative for storage
        const incidentNarrative = [
          `INCIDENT DATE: ${incidentDate}`,
          incidentLocation ? `LOCATION: ${incidentLocation}` : '',
          `SEVERITY: ${incidentSeverity}`,
          incidentPeopleInvolved ? `PEOPLE INVOLVED: ${incidentPeopleInvolved}` : '',
          `\nDESCRIPTION:\n${narrative}`,
          incidentActionsTaken ? `\nACTIONS TAKEN:\n${incidentActionsTaken}` : '',
        ].filter(Boolean).join('\n');
        data.narrative = incidentNarrative;
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
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to save note');
      }
    } catch (err) {
      console.error('Error saving note:', err);
      setError('Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  const currentNoteType = NOTE_TYPES.find(nt => nt.value === noteType);

  const formatVisitOption = (visit) => {
    const date = new Date(visit.startTime).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
    const time = new Date(visit.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
    return `${visit.title || 'Visit'} — ${date} at ${time}`;
  };

  const textareaStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--color-border)',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const labelStyle = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--color-text)',
    display: 'block',
    marginBottom: '8px',
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
          <label style={labelStyle}>
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
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: noteType === type.value ? 'white' : 'var(--color-text)',
                  }}
                >
                  {type.label}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: noteType === type.value ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)',
                    marginTop: '2px',
                  }}
                >
                  {type.description.substring(0, 50)}...
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* BUG-10 FIX: Visit Link as searchable dropdown instead of raw UUID input */}
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>
            Link to Visit (optional)
          </label>
          <select
            value={visitId}
            onChange={(e) => setVisitId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '14px',
              backgroundColor: 'white',
            }}
          >
            <option value="">— No visit linked —</option>
            {visitsLoading ? (
              <option disabled>Loading visits...</option>
            ) : (
              clientVisits.map(visit => (
                <option key={visit.id} value={visit.id}>
                  {formatVisitOption(visit)}
                </option>
              ))
            )}
          </select>
        </div>

        {/* SOAP Sections */}
        {noteType === 'SOAP' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>
                Subjective (Patient&apos;s own words)
              </label>
              <textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="What does the patient report? Symptoms, complaints, feelings..."
                rows={3}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Objective (Observable findings)
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Vital signs, physical exam findings, observations..."
                rows={3}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Assessment (Clinical judgment)
              </label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Your clinical assessment and diagnosis..."
                rows={3}
                style={textareaStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Plan (Next steps)
              </label>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="Treatment plan, follow-up, patient education..."
                rows={3}
                style={textareaStyle}
              />
            </div>
          </div>
        )}

        {/* Narrative for DAP and Narrative types */}
        {(noteType === 'DAP' || noteType === 'NARRATIVE') && (
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>
              {noteType === 'DAP' ? 'DAP/Narrative Content' : 'Narrative Note'}
            </label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Document your observations, assessments, and plan..."
              rows={8}
              style={textareaStyle}
            />
          </div>
        )}

        {/* BUG-16 FIX: Incident Report specific fields */}
        {noteType === 'INCIDENT' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {/* Incident Alert Header */}
            <div style={{
              padding: '12px 16px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#DC2626',
              fontSize: '13px',
            }}>
              <AlertTriangle size={16} />
              Complete all required fields to document this incident properly.
            </div>

            {/* Incident Date/Time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>
                  <Calendar size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  Incident Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Severity *
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {INCIDENT_SEVERITIES.map(sev => (
                    <button
                      key={sev.value}
                      onClick={() => setIncidentSeverity(sev.value)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '6px',
                        border: incidentSeverity === sev.value ? `2px solid ${sev.color}` : '2px solid var(--color-border)',
                        backgroundColor: incidentSeverity === sev.value ? `${sev.color}15` : 'white',
                        color: incidentSeverity === sev.value ? sev.color : 'var(--color-text-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {sev.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={labelStyle}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                Location
              </label>
              <input
                type="text"
                value={incidentLocation}
                onChange={(e) => setIncidentLocation(e.target.value)}
                placeholder="Where did the incident occur? (e.g., Client's bedroom, kitchen)"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* People Involved */}
            <div>
              <label style={labelStyle}>
                <Users size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                People Involved
              </label>
              <input
                type="text"
                value={incidentPeopleInvolved}
                onChange={(e) => setIncidentPeopleInvolved(e.target.value)}
                placeholder="Names and roles of people involved"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Incident Description */}
            <div>
              <label style={labelStyle}>
                Incident Description *
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                placeholder="Describe what happened in detail: what was observed, circumstances, contributing factors..."
                rows={5}
                style={textareaStyle}
              />
            </div>

            {/* Actions Taken */}
            <div>
              <label style={labelStyle}>
                Actions Taken
              </label>
              <textarea
                value={incidentActionsTaken}
                onChange={(e) => setIncidentActionsTaken(e.target.value)}
                placeholder="What immediate actions were taken? Who was notified?"
                rows={3}
                style={textareaStyle}
              />
            </div>
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
