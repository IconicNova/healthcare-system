'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Image from 'next/image';
import Tabs from '@/components/ui/Tabs';
import { Info, ListTodo, FileText, Target, Check, Save, Clock, AlertTriangle, Paperclip } from 'lucide-react';
import VisitTasksTab from './EditVisitTasksTab';
import VisitNotesTab from './VisitNotesTab';
import EditVisitFormsTab from './EditVisitFormsTab';
import FileAttachments from './FileAttachments';
// StaffAssignment available for use in staff column
import {
  getValidNextStatuses,
  getStatusColor,
  getStatusLabel,
  canTransition,
  isTerminalStatus,
} from '@/lib/visit-status-machine';

export default function EditVisitDialog({ isOpen, onClose, visit, onSave, formReturnTo = '' }) {
    const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'SCHEDULED',
    notes: '',
    actualStart: null,
    actualEnd: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [validationError, setValidationError] = useState('');
  const [carePlanGoals, setCarePlanGoals] = useState([]);
  const [goalsLoading, setGoalsLoading] = useState(false);

  // Keyboard shortcuts
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  /* eslint-enable react-hooks/exhaustive-deps */

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
      setValidationError('');
    }
  }, [visit, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('info');
    }
  }, [isOpen, visit?.id]);

  // Load care plan goals when Goals tab is active
  useEffect(() => {
    if (activeTab === 'goals' && visit?.carePlanId) {
      setGoalsLoading(true);
      fetch(`/api/care-plans/${visit.carePlanId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setCarePlanGoals(data.services || []);
          }
        })
        .catch(() => {})
        .finally(() => setGoalsLoading(false));
    }
  }, [activeTab, visit?.carePlanId]);

  const handleStatusChange = (newStatus) => {
    if (!canTransition(formData.status, newStatus)) {
      setValidationError(`Cannot change status from "${getStatusLabel(formData.status)}" to "${getStatusLabel(newStatus)}"`);
      return;
    }
    setValidationError('');
    setFormData(prev => ({ ...prev, status: newStatus }));
  };

  const handleSubmit = async () => {
    if (!visit) return;

    // Validate actual times
    if (formData.actualEnd && !formData.actualStart) {
      setValidationError('Cannot set end time without a start time. Please set the start time first.');
      return;
    }

    if (formData.actualStart && formData.actualEnd) {
      if (new Date(formData.actualEnd) <= new Date(formData.actualStart)) {
        setValidationError('End time must be after start time.');
        return;
      }
    }

    // Validate status transition
    if (!canTransition(visit.status, formData.status)) {
      setValidationError(`Cannot change status from "${getStatusLabel(visit.status)}" to "${getStatusLabel(formData.status)}"`);
      return;
    }

    setValidationError('');
    setIsSaving(true);
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        notes: formData.notes,
      };

      if (formData.actualStart) {
        updateData.actualStart = formData.actualStart.toISOString();
      }
      if (formData.actualEnd) {
        updateData.actualEnd = formData.actualEnd.toISOString();
      }

      const response = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        if (onSave) onSave(await response.json());
      } else {
        const errData = await response.json().catch(() => ({}));
        setValidationError(errData.error || 'Failed to save visit');
      }
    } catch (error) {
      console.error('Error saving visit:', error);
      setValidationError('Failed to save visit. Please try again.');
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
      setValidationError('Failed to start visit');
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
      setValidationError('Failed to complete visit');
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

  // BUG-02 FIX: Only show valid next statuses
  const validStatuses = getValidNextStatuses(visit?.status || formData.status);

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
        {/* Validation Error Banner */}
        {validationError && (
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
            {validationError}
          </div>
        )}

        {/* Visit Header */}
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visit Details</h4>
            {/* BUG-02 FIX: Status dropdown only shows valid transitions */}
            <select
              value={formData.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={isTerminalStatus(visit.status)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${getStatusColor(formData.status)}`,
                backgroundColor: 'white',
                fontSize: '13px',
                fontWeight: 500,
                color: getStatusColor(formData.status),
                cursor: isTerminalStatus(visit.status) ? 'not-allowed' : 'pointer',
                opacity: isTerminalStatus(visit.status) ? 0.6 : 1,
              }}
            >
              {validStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px', marginBottom: '16px' }}>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Client</span>
            <span style={{ fontSize: '13px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {visit.client?.avatar ? (
                <Image src={visit.client.avatar} alt="" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600, color: 'white' }}>
                  {visit.client?.firstName?.charAt(0)}{visit.client?.lastName?.charAt(0)}
                </span>
              )}
              {visit.client?.firstName} {visit.client?.lastName}
            </span>

            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Address</span>
            <span style={{ fontSize: '13px' }}>
              {[visit.client?.address, visit.client?.city, visit.client?.state].filter(Boolean).join(', ')}
            </span>

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
                  {!formData.actualStart && (formData.status === 'SCHEDULED' || formData.status === 'CLOCKED_IN' || formData.status === 'LATE') && (
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
                        whiteSpace: 'nowrap',
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
                  {/* BUG-04 FIX: disabled as HTML attribute, not CSS property */}
                  <input
                    type="datetime-local"
                    value={formData.actualEnd ? new Date(formData.actualEnd.getTime() - formData.actualEnd.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, actualEnd: e.target.value ? new Date(e.target.value) : null }))}
                    disabled={!formData.actualStart}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                      fontSize: '13px',
                      opacity: !formData.actualStart ? 0.5 : 1,
                      cursor: !formData.actualStart ? 'not-allowed' : 'text',
                    }}
                  />
                  {formData.actualStart && !formData.actualEnd && (formData.status === 'IN_PROGRESS' || formData.status === 'CLOCKED_IN') && (
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
                        whiteSpace: 'nowrap',
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

  // BUG-08 FIX: Goals tab now shows real care plan goals
  const renderGoalsTab = () => {
    if (!visit?.carePlanId) {
      return (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          <Target size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', fontWeight: 500 }}>No Care Plan Linked</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Link a care plan to this visit to see goals and services.</p>
        </div>
      );
    }

    if (goalsLoading) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
          <div className="loading-spinner" />
        </div>
      );
    }

    return (
      <div style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Care Plan Goals & Services</h4>
        {carePlanGoals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', backgroundColor: 'var(--color-gray-50)', borderRadius: '12px' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No services defined in this care plan yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {carePlanGoals.map((goal, index) => (
              <div
                key={goal.id || index}
                style={{
                  padding: '16px',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-white)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>
                    {goal.service?.name || goal.instructions || `Service ${index + 1}`}
                  </span>
                  {goal.frequency && (
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      backgroundColor: '#DBEAFE',
                      color: '#1D4ED8',
                    }}>
                      {goal.frequencyText || goal.frequency}
                    </span>
                  )}
                </div>
                {goal.instructions && (
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    {goal.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const tabs = [
    {
      value: 'info',
      label: 'Information',
      icon: Info,
    },
    {
      value: 'tasks',
      label: 'Service Tasks',
      icon: ListTodo,
    },
    {
      value: 'forms',
      label: 'Forms',
      icon: FileText,
    },
    {
      value: 'notes',
      label: 'View Notes',
      icon: FileText,
    },
    {
      value: 'goals',
      label: 'Goals',
      icon: Target,
    },
    { id: 'attachments', label: 'Attachments', icon: Paperclip, content: <FileAttachments visitId={visit?.id} /> },
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
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div>
            {/* BUG-09 FIX: info tab rendered only once here, not also in tabs array */}
            {activeTab === 'info' && renderInfoTab()}
            {activeTab === 'tasks' && <VisitTasksTab visitId={visit?.id} />}
            {activeTab === 'forms' && <EditVisitFormsTab visitId={visit?.id} returnTo={formReturnTo} />}
            {/* BUG-07 FIX: Using real VisitNotesTab instead of stub EditVisitNotesTab */}
            {activeTab === 'notes' && <VisitNotesTab visitId={visit?.id} />}
            {/* BUG-08 FIX: Real goals content */}
            {activeTab === 'goals' && renderGoalsTab()}
          </div>
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
