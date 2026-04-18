'use client';

import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
];

export default function VisitReportBuilder({ clientId, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState([]);

  const [reportType, setReportType] = useState('VISIT_SUMMARY');
  const [period, setPeriod] = useState('DAILY');
  const [selectedVisits, setSelectedVisits] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState('');
  const [clientCondition, setClientCondition] = useState('');
  const [notableEvents, setNotableEvents] = useState('');
  const [recommendations, setRecommendations] = useState('');

  useEffect(() => {
    // Set default date range based on period
    const today = new Date();
    const start = new Date();

    if (period === 'WEEKLY') {
      start.setDate(today.getDate() - 7);
    } else if (period === 'MONTHLY') {
      start.setDate(today.getDate() - 30);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [period]);

  useEffect(() => {
    // Fetch recent visits when component mounts
    if (!clientId) return;

    const fetchVisits = async () => {
      try {
        const response = await fetch(`/api/clients/${clientId}/visits?limit=50`);
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visits || []);
        }
      } catch (error) {
        console.error('Error fetching visits:', error);
      }
    };

    fetchVisits();
  }, [clientId]);

  const handleGenerateReport = async () => {
    setError('');
    setSubmitting(true);

    try {
      const data = {
        clientId,
        type: reportType,
        period: reportType === 'PERIOD_SUMMARY' ? period : null,
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date().toISOString(),
        summary,
        clientCondition: clientCondition || null,
        notableEvents: notableEvents || null,
        recommendations: recommendations || null,
        visitIds: reportType === 'VISIT_SUMMARY' && selectedVisits.length > 0 ? selectedVisits : null,
      };

      // For visit summary, try to generate from visit data
      if (reportType === 'VISIT_SUMMARY' && selectedVisits.length > 0) {
        const generateResponse = await fetch(`/api/reports/${clientId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (generateResponse.ok) {
          onSuccess();
          return;
        }
      }

      // Otherwise create manually
      const response = await fetch(`/api/clients/${clientId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      setError('Failed to create report');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVisitSelection = (visitId) => {
    setSelectedVisits(prev =>
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const steps = [
    { number: 1, label: 'Report Type' },
    { number: 2, label: reportType === 'VISIT_SUMMARY' ? 'Select Visit(s)' : 'Date Range' },
    { number: 3, label: 'Content' },
    { number: 4, label: 'Review' },
  ];

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
          maxHeight: '90vh',
          overflow: 'auto',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Generate Visit Report</h4>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Step {step} of {steps.length}
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

        {/* Progress Steps */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {steps.map(s => (
            <div
              key={s.number}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: step === s.number ? 'var(--color-primary)' : 'var(--color-gray-100)',
                color: step === s.number ? 'white' : 'var(--color-text-muted)',
                fontSize: '12px',
                fontWeight: 500,
                textAlign: 'center',
              }}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Step 1: Report Type */}
        {step === 1 && (
          <div>
            <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Select Report Type</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setReportType('VISIT_SUMMARY')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: reportType === 'VISIT_SUMMARY' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  backgroundColor: reportType === 'VISIT_SUMMARY' ? 'var(--color-primary-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: reportType === 'VISIT_SUMMARY' ? 'white' : 'var(--color-text)',
                    marginBottom: '4px',
                  }}
                >
                  Visit Summary
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: reportType === 'VISIT_SUMMARY' ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)',
                  }}
                >
                  Document a single visit with detailed information
                </div>
              </button>
              <button
                onClick={() => setReportType('PERIOD_SUMMARY')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: reportType === 'PERIOD_SUMMARY' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                  backgroundColor: reportType === 'PERIOD_SUMMARY' ? 'var(--color-primary-light)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: reportType === 'PERIOD_SUMMARY' ? 'white' : 'var(--color-text)',
                    marginBottom: '4px',
                  }}
                >
                  Period Summary
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: reportType === 'PERIOD_SUMMARY' ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)',
                  }}
                >
                  Aggregate multiple visits into daily, weekly, or monthly report
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Date Range & Visits */}
        {step === 2 && (
          <div>
            {reportType === 'PERIOD_SUMMARY' ? (
              <>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Select Period</h5>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriod(opt.value)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: period === opt.value ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
                        backgroundColor: period === opt.value ? 'var(--color-primary-light)' : 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: period === opt.value ? 'white' : 'var(--color-text)',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        fontSize: '14px',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>
                {/* BUG-13 FIX: Date validation */}
                {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', fontSize: '13px', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ End date must be on or after start date.
                  </div>
                )}
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  The system will automatically include all visits within the selected date range.
                </div>
              </>
            ) : (
              <>
                <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Select Visit(s)</h5>
                {visits.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    <p style={{ fontSize: '13px' }}>No visits available for this client.</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '300px', overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    {visits.map(visit => (
                      <div
                        key={visit.id}
                        onClick={() => toggleVisitSelection(visit.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          backgroundColor: selectedVisits.includes(visit.id) ? 'var(--color-primary-light)' : 'white',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: selectedVisits.includes(visit.id) ? 'white' : 'var(--color-text)' }}>{visit.title}</div>
                            <div style={{ fontSize: '11px', color: selectedVisits.includes(visit.id) ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-muted)' }}>{formatDate(visit.startTime)}</div>
                          </div>
                          {selectedVisits.includes(visit.id) && <Check size={18} style={{ color: 'white' }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 3: Content */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: '8px' }}>
                Summary *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write a summary of the visit or period..."
                rows={4}
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
                Client Condition
              </label>
              <textarea
                value={clientCondition}
                onChange={(e) => setClientCondition(e.target.value)}
                placeholder="Describe the client's current condition..."
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
                Notable Events
              </label>
              <textarea
                value={notableEvents}
                onChange={(e) => setNotableEvents(e.target.value)}
                placeholder="Any significant events during this period..."
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
                Recommendations
              </label>
              <textarea
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                placeholder="Next steps and recommendations..."
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

        {/* Step 4: Review */}
        {step === 4 && (
          <div>
            <h5 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Review Report</h5>
            <div style={{ padding: '16px', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Type</span>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{reportType === 'VISIT_SUMMARY' ? 'Visit Summary' : `Period Summary (${period})`}</div>
              </div>
              {reportType === 'VISIT_SUMMARY' && selectedVisits.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Visits Included</span>
                  <div style={{ fontSize: '14px' }}>{selectedVisits.length} visit(s) selected</div>
                </div>
              )}
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Summary Preview</span>
                <div style={{ fontSize: '14px', marginTop: '4px', whiteSpace: 'pre-wrap' }}>
                  {summary || 'No summary provided'}
                </div>
              </div>
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

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
              color: step === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1,
            }}
          >
            Back
          </button>
          {step < 4 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              disabled={
                (reportType === 'VISIT_SUMMARY' && selectedVisits.length === 0 && step === 2) ||
                (reportType === 'PERIOD_SUMMARY' && (!startDate || !endDate) && step === 2) ||
                (reportType === 'PERIOD_SUMMARY' && startDate && endDate && new Date(endDate) < new Date(startDate) && step === 2) ||
                (step === 3 && !summary)
              }
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: (
                  (reportType === 'VISIT_SUMMARY' && selectedVisits.length === 0 && step === 2) ||
                  (reportType === 'PERIOD_SUMMARY' && (!startDate || !endDate) && step === 2) ||
                  (step === 3 && !summary)
                ) ? 'var(--color-gray-300)' : 'var(--color-primary)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: (
                  (reportType === 'VISIT_SUMMARY' && selectedVisits.length === 0 && step === 2) ||
                  (reportType === 'PERIOD_SUMMARY' && (!startDate || !endDate) && step === 2) ||
                  (step === 3 && !summary)
                ) ? 'not-allowed' : 'pointer',
                opacity: (
                  (reportType === 'VISIT_SUMMARY' && selectedVisits.length === 0 && step === 2) ||
                  (reportType === 'PERIOD_SUMMARY' && (!startDate || !endDate) && step === 2) ||
                  (step === 3 && !summary)
                ) ? 0.5 : 1,
              }}
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleGenerateReport}
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
                opacity: submitting ? 0.5 : 1,
              }}
            >
              {submitting ? 'Generating...' : 'Generate Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
