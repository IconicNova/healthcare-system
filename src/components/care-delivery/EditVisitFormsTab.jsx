'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, AlertCircle } from 'lucide-react';
import { buildCareDeliveryFormPath } from '@/components/care-delivery/care-delivery.helpers';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  buildVisitFormSections,
  getVisitFormAction,
} from './edit-visit-forms.helpers';

function FormSection({ title, entries, loadingTemplateId, onAction }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          marginBottom: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {title} ({entries.length})
      </div>

      {entries.length === 0 ? (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-gray-50)',
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
          }}
        >
          No forms in this section
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {entries.map((entry) => {
            const action = getVisitFormAction(entry);
            const isBusy = loadingTemplateId === entry.id;

            return (
              <div
                key={entry.id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-white)',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '16px',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {entry.name}
                      </div>
                      {entry.description && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                          {entry.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusBadge status={entry.form?.status || 'Not Started'} />
                    {entry.isRequired && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: '#92400e',
                          backgroundColor: 'var(--color-warning-light)',
                          padding: '4px 8px',
                          borderRadius: '999px',
                        }}
                      >
                        Required
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onAction(entry)}
                  disabled={isBusy}
                  style={{
                    minWidth: '100px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: action.variant === 'primary' ? 'none' : '1px solid var(--color-border)',
                    backgroundColor: action.variant === 'primary' ? 'var(--color-primary)' : 'white',
                    color: action.variant === 'primary' ? 'white' : 'var(--color-text)',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy ? 'Opening...' : action.label}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function EditVisitFormsTab({ visitId, returnTo = '', onCountChange }) {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingTemplateId, setLoadingTemplateId] = useState(null);
  const onCountChangeRef = useRef(onCountChange);

  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  useEffect(() => {
    if (!visitId) return;

    const fetchVisitFormsData = async () => {
      setLoading(true);
      setError('');

      try {
        const [templatesResponse, formsResponse] = await Promise.all([
          fetch('/api/forms/templates'),
          fetch(`/api/visits/${visitId}/forms`),
        ]);

        if (!templatesResponse.ok || !formsResponse.ok) {
          throw new Error('Failed to load visit forms');
        }

        const templatesData = await templatesResponse.json();
        const formsData = await formsResponse.json();

        setTemplates(templatesData.templates || []);
        setForms(formsData.forms || []);
      } catch (fetchError) {
        console.error('Error fetching visit forms:', fetchError);
        setError('Unable to load visit forms right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchVisitFormsData();
  }, [visitId]);

  const sections = useMemo(
    () => buildVisitFormSections(templates, forms),
    [templates, forms]
  );

  // UX-11: Report form count to parent for tab badge
  useEffect(() => {
    onCountChangeRef.current?.(forms.length);
  }, [forms]);

  // UX-11: Compute form completion summary
  const formSummary = useMemo(() => {
    const total = forms.length;
    const completed = forms.filter(f => f.status === 'SUBMITTED' || f.status === 'APPROVED').length;
    const requiredForms = sections.required || [];
    const requiredPending = requiredForms.filter(e => {
      if (!e.form) return true;
      return e.form.status === 'DRAFT';
    }).length;
    return { total, completed, requiredPending };
  }, [forms, sections]);

  const handleAction = async (entry) => {
    const existingFormId = entry.form?.id;

    if (existingFormId) {
      router.push(returnTo ? buildCareDeliveryFormPath(existingFormId, returnTo) : `/care-delivery/forms/${existingFormId}`);
      return;
    }

    setLoadingTemplateId(entry.id);
    setError('');

    try {
      const response = await fetch(`/api/visits/${visitId}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: entry.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to create form');
      }

      const form = await response.json();
      const nextForm = form.form || form;

      setForms((prev) => {
        const withoutSameTemplate = prev.filter(
          (existingForm) => existingForm.templateId !== nextForm.templateId
        );
        return [nextForm, ...withoutSameTemplate];
      });

      router.push(returnTo ? buildCareDeliveryFormPath(nextForm.id, returnTo) : `/care-delivery/forms/${nextForm.id}`);
    } catch (actionError) {
      console.error('Error opening visit form:', actionError);
      setError('Unable to open this form right now.');
    } finally {
      setLoadingTemplateId(null);
    }
  };

  if (!visitId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        Select a visit to manage forms
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visit Forms</h4>
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
          Open required documentation and complete additional visit forms.
        </p>
      </div>

      {/* UX-11: Form completion summary */}
      {forms.length > 0 && (
        <div style={{
          display: 'flex', gap: '16px', padding: '12px 16px',
          background: 'var(--color-bg-secondary)', borderRadius: '10px',
          marginBottom: '16px', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{formSummary.completed}/{formSummary.total}</span>
            <span style={{ color: 'var(--color-text-secondary)' }}>forms completed</span>
          </div>
          {formSummary.requiredPending > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '2px 8px', borderRadius: '6px',
              background: '#FEE2E2', color: '#B91C1C', fontSize: '12px', fontWeight: 500,
            }}>
              ⚠ {formSummary.requiredPending} required pending
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--color-error-light)',
            color: '#991b1b',
            marginBottom: '16px',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <FormSection
        title="Required"
        entries={sections.required}
        loadingTemplateId={loadingTemplateId}
        onAction={handleAction}
      />
      <FormSection
        title="Other"
        entries={sections.other}
        loadingTemplateId={loadingTemplateId}
        onAction={handleAction}
      />
    </div>
  );
}
