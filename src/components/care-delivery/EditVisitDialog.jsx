'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import { Info, ListTodo, FileText, Target, Check, Save, Clock } from 'lucide-react';
import VisitTasksTab from './EditVisitTasksTab';
import VisitNotesTab from './EditVisitNotesTab';

const STATUS_OPTIONS = [
  { value: 'VACANT', label: 'Vacant', color: '#8B5CF6' },
  { value: 'SCHEDULED', label: 'Scheduled', color: '#3B82F6' },
  { value: 'OFFERED', label: 'Offered', color: '#6366F1' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#F59E0B' },
  { value: 'CLOCKED_IN', label: 'Clocked In', color: '#0EA5E9' },
  { value: 'COMPLETED', label: 'Completed', color: '#16A34A' },
  { value: 'APPROVED', label: 'Approved', color: '#059669' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#9CA3AF' },
  { value: 'ON_HOLD', label: 'On Hold', color: '#D97706' },
  { value: 'NO_SHOW', label: 'No Show', color: '#EF4444' },
  { value: 'MISSED', label: 'Missed', color: '#DC2626' },
  { value: 'LATE', label: 'Late', color: '#EA580C' },
];

export default function EditVisitDialog({ isOpen, onClose, visit, onSave }) {
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'SCHEDULED',
    notes: '',
    actualStart: null,
    actualEnd: null,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visit) {
      setFormData({
        title: visit.title || '',
        description: visit.description || '',
        status: visit.status || 'SCHEDULED',
        notes: visit.notes || '',
        actualStart: visit.actualStart ? new Date(visit.actualStart) : null,
        actualEnd: visit.actualEnd ? new Date(visit.actualEnd) : null,
      });
    }
  }, [visit, isOpen]);

  const handleSubmit = async () => {
    if (!visit) return;

    setIsSaving(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        notes: formData.notes,
      };

      // Only include actual times if they're set
      if (formData.actualStart) {
        updateData.actualStart = formData.actualStart.toISOString();
      }
      if (formData.actualEnd) {
        updateData.actualEnd = formData.actualEnd.toISOString();
      }

      // Auto-complete visit if actual end time is set
      if (formData.actualEnd && !formData.actualStart) {
        updateData.actualStart = formData.actualEnd;
      }

      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        if (onSave) onSave(await response.json());
      }
    } catch (error) {
      console.error('Error saving visit:', error);
      alert('Failed to save visit');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartVisit = async () => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      actualStart: now,
      status: 'IN_PROGRESS',
    }));

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualStart: now.toISOString(),
          status: 'IN_PROGRESS',
        }),
      });

      if (response.ok) {
        if (onSave) onSave(await response.json());
      }
    } catch (error) {
      console.error('Error starting visit:', error);
    }
  };

  const handleEndVisit = async () => {
    const now = new Date();
    setFormData(prev => ({
      ...prev,
      actualEnd: now,
      status: 'COMPLETED',
    }));

    try {
      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actualStart: formData.actualStart?.toISOString() || now.toISOString(),
          actualEnd: now.toISOString(),
          status: 'COMPLETED',
        }),
      });

      if (response.ok) {
        if (onSave) onSave(await response.json());
      }
    } catch (error) {
      console.error('Error ending visit:', error);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option ? option.color : '#3B82F6';
  };

  const renderInfoTab = () => {
    if (!visit) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          No visit selected
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Visit Header */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visit Details</h4>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${getStatusColor(formData.status)}`,
                backgroundColor: 'white',
                fontSize: '13px',
                fontWeight: 500,
                color: getStatusColor(formData.status),
                cursor: 'pointer',
              }}
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Client</span>
            <span style={{ fontSize: '13px', fontWeight: 500 }}>{visit.client?.firstName} {visit.client?.lastName}</span>

            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Address</span>
            <span style={{ fontSize: '13px' }}>{visit.client?.address}, {visit.client?.city} {visit.client?.state}</span>

            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Staff</span>
            <span style={{ fontSize: '13px' }}>{visit.staff ? `${visit.staff.firstName} ${visit.staff.lastName}` : 'Unassigned'}</span>

            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Scheduled</span>
            <span style={{ fontSize: '13px' }}>
              {formatDateTime(visit.startTime)} - {formatDateTime(visit.endTime)}
            </span>
          </div>

          {/* Actual Visit Times */}
          <div style={{ padding: '12px', backgroundColor: 'var(--color-gray-50)', borderRadius: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '12px', color: 'var(--color-text)' }}>
              Actual Visit Times
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Start Time
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="datetime-local"
                    value={formData.actualStart ? new Date(formData.actualStart.getTime() - formData.actualStart.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualStart: e.target.value ? new Date(e.target.value) : null }))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                    }}
                  />
                  {!formData.actualStart && visit.status === 'SCHEDULED' && (
                    <button
                      onClick={handleStartVisit}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#F59E0B',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Clock size={14} />
                      Start
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                  End Time
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="datetime-local"
                    value={formData.actualEnd ? new Date(formData.actualEnd.getTime() - formData.actualEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualEnd: e.target.value ? new Date(e.target.value) : null }))}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                      disabled: !formData.actualStart,
                    }}
                  />
                  {formData.actualStart && !formData.actualEnd && visit.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleEndVisit}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#16A34A',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Check size={14} />
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </div>
            {formData.actualStart && formData.actualEnd && (
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-success)' }}>
                Visit Duration: {Math.round((new Date(formData.actualEnd) - new Date(formData.actualStart)) / 60000)} minutes
              </div>
            )}
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Wound Care & Medication Review"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the purpose of this visit..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '6px' }}>
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any notes about this visit..."
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              fontSize: '13px',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    );
  };

  const tabs = [
    {
      value: 'info',
      label: 'Information',
      icon: Info,
      content: renderInfoTab(),
    },
    {
      value: 'tasks',
      label: 'Service Tasks',
      icon: ListTodo,
      content: <VisitTasksTab visitId={visit?.id} />,
    },
    {
      value: 'notes',
      label: 'View Notes',
      icon: FileText,
      content: <VisitNotesTab visitId={visit?.id} />,
    },
    {
      value: 'goals',
      label: 'Goals',
      icon: Target,
      content: (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Target size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>Goals Management</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Care goals for this visit will appear here</p>
        </div>
      ),
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Visit${visit?.client?.firstName ? ` - ${visit.client.firstName} ${visit.client.lastName}` : ''}`}
      size="xl"
    >
      <div style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Tabs tabs={tabs} defaultTab="info" />
        </div>
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-gray-50)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
        }}>
          <button
            onClick={onClose}
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
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              fontSize: '13px',
              fontWeight: 500,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
