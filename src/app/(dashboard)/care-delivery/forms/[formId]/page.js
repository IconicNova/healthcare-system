'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Check, Clock, AlertCircle, Eye } from 'lucide-react';
import FormFieldRenderer from '@/components/care-delivery/FormFieldRenderer';

function normalizeFormStatus(status) {
  if (status === 'PENDING') return 'DRAFT';
  if (status === 'COMPLETED') return 'SUBMITTED';
  return status || 'DRAFT';
}

function formatReadOnlyValue(value) {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

export default function FormChartingPage({ params }) {
  const router = useRouter();
  const { formId } = params;

  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
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

          // Initialize form data with existing data or empty object
          const initialData = data.form.formData || {};
          setFormData(initialData);
        } else {
          alert('Failed to load form');
          router.push('/care-delivery');
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        alert('Failed to load form');
        router.push('/care-delivery');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId, router]);

  // Debounced auto-save
  const saveForm = useCallback(async () => {
    if (!form || saving || saveStatus === 'saved' || !isEditable) return;

    setSaving(true);
    setSaveStatus('saving');

    try {
      // Validate required fields
      const errors = {};
      const schema = form.template?.schema || {};
      const sections = schema.sections || [];

      sections.forEach(section => {
        (section.fields || []).forEach(field => {
          if (field.required && !formData[field.name]) {
            errors[field.name] = `${field.label} is required`;
          }
        });
      });

      setValidationErrors(errors);

      if (Object.keys(errors).length > 0) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData }),
      });

      if (response.ok) {
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
  }, [form, formData, saving, saveStatus, formId, isEditable]);

  // Auto-save with debounce (2 seconds)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveForm();
    }, 2000);

    return () => clearTimeout(timeout);
  }, [formData, saveForm]);

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

    // Validate all required fields
    const errors = {};
    const schema = form.template?.schema || {};
    const sections = schema.sections || [];

    sections.forEach(section => {
      (section.fields || []).forEach(field => {
        if (field.required && !formData[field.name]) {
          errors[field.name] = `${field.label} is required`;
        }
      });
    });

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
        router.push('/care-delivery');
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

  const schema = form.template?.schema || {};
  const sections = schema.sections || [];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <button
            onClick={() => router.push('/care-delivery')}
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
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
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
        </div>
      </div>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: saveStatus === 'saved' ? 'var(--color-success-light)' :
                          saveStatus === 'error' ? 'var(--color-error-light)' : 'var(--color-gray-50)',
          fontSize: '13px',
          fontWeight: 500,
          color: saveStatus === 'saved' ? '#065f46' :
                 saveStatus === 'error' ? '#991b1b' : 'var(--color-text-secondary)',
        }}>
          {saveStatus === 'saving' && <Clock size={16} />}
          {saveStatus === 'saved' && <Check size={16} />}
          {saveStatus === 'error' && <AlertCircle size={16} />}
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && 'Saved successfully!'}
          {saveStatus === 'error' && 'Error saving form. Please check required fields.'}
        </div>
      )}

      {/* Form Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="card">
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-gray-50)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                {section.name}
              </h3>
            </div>
            <div style={{ padding: '20px' }}>
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
      <div style={{
        padding: '20px 0',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
      }}>
        <button
          onClick={() => setShowPreview(true)}
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
            cursor: 'pointer',
          }}
        >
          <Eye size={18} />
          Preview
        </button>
        {isEditable ? (
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: saving ? 'var(--color-gray-200)' : 'var(--color-primary)',
              color: saving ? 'var(--color-text-muted)' : 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            <Save size={18} />
            {saving ? 'Submitting...' : 'Submit Form'}
          </button>
        ) : (
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
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 500,
        }} onClick={() => setShowPreview(false)}>
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Form Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '8px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--color-gray-100)',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              {sections.map((section, sectionIndex) => (
                <div key={sectionIndex} style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    {section.name}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {(section.fields || []).map((field, fieldIndex) => (
                      <div key={fieldIndex}>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                          {field.label} {field.required && <span style={{ color: 'var(--color-error)' }}>*</span>}
                        </div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text)', padding: '10px', backgroundColor: 'var(--color-gray-50)', borderRadius: '6px' }}>
                          {formData[field.name] || '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setShowPreview(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
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

