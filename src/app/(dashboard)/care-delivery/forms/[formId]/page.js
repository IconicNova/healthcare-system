'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Check, Clock, AlertCircle, Eye } from 'lucide-react';
import FormFieldRenderer from '@/components/care-delivery/FormFieldRenderer';
import { resolveCareDeliveryReturnTo } from '@/components/care-delivery/care-delivery.helpers';
import { mergeFormDataWithPrefill } from '@/lib/form-prefill';
import {
  normalizeFormSchema,
  normalizeFormStatus,
  shouldScheduleFormAutosave,
} from '@/lib/form-review';

function formatReadOnlyValue(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function isMissingValue(value) {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === 'string') {
    return value.trim().length === 0;
  }

  if (typeof value === 'boolean') {
    return value === false;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function getRequiredFieldErrors(schema, formData) {
  const errors = {};
  const sections = normalizeFormSchema(schema).sections || [];

  sections.forEach((section) => {
    (section.fields || []).forEach((field) => {
      if (field.required && isMissingValue(formData?.[field.name])) {
        errors[field.name] = `${field.label} is required`;
      }
    });
  });

  return errors;
}

export default function FormChartingPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formId } = params;

  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [initialFormData, setInitialFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const returnTo = resolveCareDeliveryReturnTo(searchParams.get('returnTo'));
  const currentStatus = normalizeFormStatus(form?.status);
  const isEditable = currentStatus === 'DRAFT';
  const statusStyles = {
    DRAFT: { backgroundColor: 'var(--color-gray-100)', color: 'var(--color-text-secondary)' },
    SUBMITTED: { backgroundColor: 'var(--color-success-light)', color: '#065f46' },
    IN_REVIEW: { backgroundColor: 'var(--color-info-light, #dbeafe)', color: '#1d4ed8' },
    APPROVED: { backgroundColor: 'var(--color-success-light)', color: '#065f46' },
    REJECTED: { backgroundColor: 'var(--color-error-light)', color: '#991b1b' },
  };
  const statusStyle = statusStyles[currentStatus] || statusStyles.DRAFT;

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(`/api/forms/${formId}`);
        if (response.ok) {
          const data = await response.json();
          setForm({
            ...data.form,
            status: normalizeFormStatus(data.form.status),
          });

          const initialData = mergeFormDataWithPrefill({
            template: data.form.template,
            visit: data.form.visit,
            formData: data.form.formData || {},
          });
          setFormData(initialData);
          setInitialFormData(initialData);
        } else {
          alert('Failed to load form');
          router.push(returnTo);
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        alert('Failed to load form');
        router.push(returnTo);
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, returnTo, router]);

  const isDirty = useMemo(
    () => JSON.stringify(formData) !== JSON.stringify(initialFormData),
    [formData, initialFormData]
  );

  // Debounced auto-save
  const saveForm = useCallback(async () => {
    if (
      !form ||
      !isDirty ||
      !shouldScheduleFormAutosave({ status: currentStatus, saving, saveStatus })
    ) {
      return;
    }

    setSaving(true);
    setSaveStatus('saving');

    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });

      if (response.ok) {
        setInitialFormData(formData);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setSaving(false);
    }
  }, [form, formData, saving, saveStatus, formId, currentStatus, isDirty]);

  // Auto-save with debounce (2 seconds)
  useEffect(() => {
    if (
      !isDirty ||
      !shouldScheduleFormAutosave({ status: currentStatus, saving, saveStatus })
    ) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      saveForm();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [currentStatus, formData, isDirty, saveForm, saveStatus, saving]);

  const handleFieldChange = (fieldName, value) => {
    if (!isEditable) {
      return;
    }

    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    if (!isEditable) {
      return;
    }

    const errors = getRequiredFieldErrors(form.template?.schema, formData);

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData,
          status: 'SUBMITTED',
        }),
      });

      if (response.ok) {
        alert('Form submitted successfully!');
        router.push(returnTo);
      } else {
        alert('Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form');
    } finally {
      setSaving(false);
    }
  };

  const handleReviewAction = async (nextStatus) => {
    let rejectionReason = '';

    if (nextStatus === 'REJECTED') {
      rejectionReason = window.prompt('Enter a rejection reason')?.trim() || '';
      if (!rejectionReason) {
        alert('A rejection reason is required.');
        return;
      }
    }

    try {
      setReviewActionLoading(true);

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          rejectionReason,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to update review status');
      }

      const payload = await response.json();
      setForm({
        ...payload.form,
        status: normalizeFormStatus(payload.form.status),
      });
    } catch (error) {
      console.error('Error updating review status:', error);
      alert(error.message || 'Failed to update review status');
    } finally {
      setReviewActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Form not found</p>
      </div>
    );
  }

  const sections = normalizeFormSchema(form.template?.schema).sections || [];

  return (
    <div className="form-charting-page">
      {/* Header */}
      <div className="form-page-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => router.push(returnTo)}
            style={{
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-gray-100)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {form.template?.name || 'Form'}
          </h1>
        </div>
        {form.template?.description && (
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
            {form.template.description}
          </p>
        )}
      </div>

      {/* Form Header Info */}
      <div className="card form-summary-card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Form</span>
            <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
              {form.template?.name}
            </div>
          </div>
          {form.visit && (
            <>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Visit</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
                  {new Date(form.visit.startTime).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Client</span>
                <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
                  {form.client?.firstName} {form.client?.lastName}
                </div>
              </div>
            </>
          )}
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Status</span>
            <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '4px 8px',
                borderRadius: '12px',
                ...statusStyle,
              }}>
                {currentStatus}
              </span>
            </div>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Reviewed</span>
            <div style={{ fontSize: '14px', fontWeight: 500, marginTop: '4px' }}>
              {form.approvedAt || form.rejectedAt
                ? new Date(form.approvedAt || form.rejectedAt).toLocaleString()
                : '-'}
            </div>
          </div>
        </div>
        {form.rejectionReason && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#991b1b' }}>
            Rejection reason: {form.rejectionReason}
          </div>
        )}
      </div>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div
          className={`form-save-banner form-save-banner-${saveStatus}`}
        >
          {saveStatus === 'saving' && <Clock size={16} />}
          {saveStatus === 'saved' && <Check size={16} />}
          {saveStatus === 'error' && <AlertCircle size={16} />}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved successfully!'}
          {saveStatus === 'error' && 'Error saving form. Please try again.'}
        </div>
      )}

      {/* Form Sections */}
      <div className="form-section-list">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="card form-section-card">
            <div className="form-section-header">
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {section.name}
              </h3>
            </div>
            <div className="form-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {(section.fields || []).map((field, fieldIndex) => (
                  <div key={fieldIndex}>
                    {isEditable ? (
                      <FormFieldRenderer
                        field={field}
                        value={formData[field.name] || ''}
                        onChange={(value) => handleFieldChange(field.name, value)}
                        error={validationErrors[field.name]}
                      />
                    ) : (
                      <div style={{ marginBottom: '12px' }}>
                        <div style={{
                          display: 'block',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--color-text)',
                          marginBottom: '8px',
                        }}>
                          {field.label}
                          {field.required && (
                            <span style={{ color: 'var(--color-error)', marginLeft: '4px' }}>*</span>
                          )}
                        </div>
                        <div style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          fontSize: '14px',
                          backgroundColor: 'var(--color-gray-50)',
                          color: 'var(--color-text)',
                          minHeight: '42px',
                          display: 'flex',
                          alignItems: 'center',
                        }}>
                          {formatReadOnlyValue(formData[field.name])}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="form-action-row">
        <button
          onClick={() => setShowPreview(true)}
          className="btn btn-secondary form-action-secondary"
        >
          <Eye size={18} />
          Preview
        </button>
        {isEditable ? (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary form-action-primary"
          >
            <Save size={18} />
            {saving ? 'Submitting...' : 'Submit Form'}
          </button>
        ) : (
          <>
            {(currentStatus === 'SUBMITTED' || currentStatus === 'REJECTED') && (
              <button
                onClick={() => handleReviewAction('IN_REVIEW')}
                disabled={reviewActionLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: reviewActionLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {reviewActionLoading ? 'Updating...' : currentStatus === 'REJECTED' ? 'Resume Review' : 'Start Review'}
              </button>
            )}
            {currentStatus === 'IN_REVIEW' && (
              <>
                <button
                  onClick={() => handleReviewAction('REJECTED')}
                  disabled={reviewActionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-error)',
                    backgroundColor: 'white',
                    color: 'var(--color-error)',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: reviewActionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Reject
                </button>
                <button
                  onClick={() => handleReviewAction('APPROVED')}
                  disabled={reviewActionLoading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--color-success)',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: reviewActionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Approve
                </button>
              </>
            )}
            {(currentStatus === 'APPROVED' || currentStatus === 'REJECTED' || currentStatus === 'SUBMITTED') && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-gray-50)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  fontWeight: 500,
                }}
              >
                Read-only after submission
              </div>
            )}
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="form-preview-backdrop" onClick={() => setShowPreview(false)}>
          <div
            className="form-preview-shell"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="form-preview-header">
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-secondary form-preview-close"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="form-preview-body">
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="form-preview-section">
                  <h4 className="form-preview-section-title">
                    {section.name}
                  </h4>
                  <div className="form-preview-grid">
                    {(section.fields || []).map((field, fieldIndex) => (
                      <div key={fieldIndex}>
                        <div className="form-preview-field-label">
                          {field.label} {field.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                        </div>
                        <div className="form-preview-value">
                          {formatReadOnlyValue(formData[field.name])}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="form-preview-footer">
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

