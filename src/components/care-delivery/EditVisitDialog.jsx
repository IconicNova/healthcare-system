'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Info, ListTodo, FileText, StickyNote, Target, Paperclip, Clock, AlertTriangle, Save } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Tabs from '@/components/ui/Tabs';
import VisitTasksTab from '@/components/care-delivery/EditVisitTasksTab';
import EditVisitFormsTab from '@/components/care-delivery/EditVisitFormsTab';
import VisitNotesTab from '@/components/care-delivery/VisitNotesTab';
import FileAttachments from '@/components/care-delivery/FileAttachments';
import {
  buildCareDeliveryVisitPath,
  formatDatetimeLocalInputValue,
  toIsoFromDatetimeLocalInputValue,
} from '@/components/care-delivery/care-delivery.helpers';
import { getValidNextStatuses, getStatusLabel, isTerminalStatus } from '@/lib/visit-status-machine';
import { getVisitTimeDeviationWarning } from '@/lib/visit-time-deviation';



function formatDateTime(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function formatDuration(startDate, endDate) {
  if (!startDate) return null;
  const end = endDate ? new Date(endDate) : new Date();
  const start = new Date(startDate);
  const diff = Math.max(0, end - start);
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// UX-9: Styled confirmation dialog (replaces window.confirm)
function ConfirmDialog({ open, title, message, confirmText, confirmColor, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(15, 23, 42, 0.54)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        background: 'white', borderRadius: '12px',
        padding: '24px', maxWidth: '400px', width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertTriangle size={20} color={confirmColor || '#F59E0B'} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{title}</h3>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
            background: 'var(--color-bg)', cursor: 'pointer', fontSize: '14px',
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: confirmColor || '#F59E0B', color: 'white', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500,
          }}>{confirmText || 'Confirm'}</button>
        </div>
      </div>
    </div>
  );
}

// UX-2: Live elapsed time component
function ElapsedTimer({ startTime }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) return;
    const update = () => setElapsed(formatDuration(startTime, null));
    update();
    const timer = setInterval(update, 30000); // update every 30s
    return () => clearInterval(timer);
  }, [startTime]);

  if (!startTime || !elapsed) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '4px 10px', borderRadius: '6px',
      background: '#FEF3C7', color: '#B45309', fontSize: '13px', fontWeight: 500,
    }}>
      <Clock size={14} />
      <span>Active: {elapsed}</span>
    </div>
  );
}

const VISIT_MODAL_TABS = ['info', 'tasks', 'forms', 'notes', 'goals', 'activities', 'attachments'];

export default function EditVisitDialog({
  isOpen,
  onClose,
  visit,
  onSave,
  initialTab = 'info',
  onTabChange,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [formData, setFormData] = useState({
    status: '', title: '', description: '', notes: '', actualStart: '', actualEnd: '',
  });
  const [initialFormData, setInitialFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [tabCounts, setTabCounts] = useState({ tasks: null, notes: 0, forms: null, attachments: 0 });
  const [goalsData, setGoalsData] = useState([]);
  const [activities, setActivities] = useState([]);

  const handleTasksCountChange = useCallback((count) => {
    setTabCounts((prev) => ({ ...prev, tasks: count }));
  }, []);

  const handleFormsCountChange = useCallback((count) => {
    setTabCounts((prev) => ({ ...prev, forms: count }));
  }, []);

  const handleNotesCountChange = useCallback((count) => {
    setTabCounts((prev) => ({ ...prev, notes: count }));
  }, []);

  const handleAttachmentsCountChange = useCallback((count) => {
    setTabCounts((prev) => ({ ...prev, attachments: count }));
  }, []);

  const visitReturnTo = useMemo(() => {
    if (!visit?.id) return '';
    return buildCareDeliveryVisitPath(visit.client?.id, visit.id, activeTab);
  }, [activeTab, visit?.client?.id, visit?.id]);

  // Reset tab + form on open/visit change
  useEffect(() => {
    if (isOpen && visit) {
      const safeTab = VISIT_MODAL_TABS.includes(initialTab) ? initialTab : 'info';
      setActiveTab(safeTab);
      const data = {
        status: visit.status || 'SCHEDULED',
        title: visit.title || (visit.service?.name || ''),     // UX-12: auto-populate from service
        description: visit.description || '',
        notes: visit.notes || '',
        actualStart: visit.actualStart ? formatDatetimeLocalInputValue(visit.actualStart) : '',
        actualEnd: visit.actualEnd ? formatDatetimeLocalInputValue(visit.actualEnd) : '',
      };
      setFormData(data);
      setInitialFormData(data);
      setError('');

      // Fetch tab counts
      fetchTabCounts(visit.id);
      fetchGoals(visit);
      fetchActivities(visit.id);
    }
  }, [initialTab, isOpen, visit]);

  useEffect(() => {
    if (!isOpen) return;
    const safeTab = VISIT_MODAL_TABS.includes(initialTab) ? initialTab : 'info';
    setActiveTab(safeTab);
  }, [initialTab, isOpen]);

  const fetchTabCounts = async (visitId) => {
    try {
      const [tasksRes, notesRes, formsRes, attachRes] = await Promise.all([
        fetch(`/api/visits/${visitId}/tasks`),
        fetch(`/api/visits/${visitId}/notes`),
        fetch(`/api/visits/${visitId}/forms`),
        fetch(`/api/visits/${visitId}/attachments`),
      ]);
      const [tasksData, notesData, formsData, attachData] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : { tasks: [] },
        notesRes.ok ? notesRes.json() : { notes: [] },
        formsRes.ok ? formsRes.json() : { forms: [] },
        attachRes.ok ? attachRes.json() : { attachments: [] },
      ]);

      const tasks = tasksData.tasks || [];
      const completedTasks = tasks.filter(t => t.completed).length;

      setTabCounts({
        tasks: `${completedTasks}/${tasks.length}`,
        notes: (notesData.notes || []).length,
        forms: (formsData.forms || []).length,
        attachments: (attachData.attachments || []).length,
      });
    } catch { /* fail silently */ }
  };

  const fetchGoals = async (v) => {
    if (!v?.carePlanId) { setGoalsData([]); return; }
    try {
      const res = await fetch(`/api/care-plans/${v.carePlanId}`);
      if (res.ok) {
        const data = await res.json();
        setGoalsData(data.services || []);
      }
    } catch { setGoalsData([]); }
  };

  const fetchActivities = async (visitId) => {
    try {
      const res = await fetch(`/api/visits/${visitId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
      }
    } catch { setActivities([]); }
  };

  // UX-1: Track dirty state
  const isDirty = useMemo(() => {
    if (!initialFormData) return false;
    return Object.keys(initialFormData).some(k => formData[k] !== initialFormData[k]);
  }, [formData, initialFormData]);

  // BUG-6 FIX: Use useCallback so Ctrl+S always uses current formData
  const handleSubmit = useCallback(async () => {
    if (!visit) return;
    setError('');
    setSaving(true);

    try {
      // LOGIC-4: Title validation
      if (formData.title && formData.title.length > 200) {
        setError('Title must be under 200 characters');
        setSaving(false);
        return;
      }
      // LOGIC-3: Description/Notes length limits
      if (formData.description && formData.description.length > 2000) {
        setError('Description must be under 2000 characters');
        setSaving(false);
        return;
      }
      if (formData.notes && formData.notes.length > 5000) {
        setError('Internal notes must be under 5000 characters');
        setSaving(false);
        return;
      }

      // LOGIC-1/2: Validate actual times
      if (formData.actualStart) {
        const actualStartDate = new Date(formData.actualStart);
        const now = new Date();
        if (actualStartDate > now) {
          setError('Actual start time cannot be in the future');
          setSaving(false);
          return;
        }
      }
      if (formData.actualEnd) {
        const actualEndDate = new Date(formData.actualEnd);
        const now = new Date();
        if (actualEndDate > now) {
          setError('Actual end time cannot be in the future');
          setSaving(false);
          return;
        }
        if (formData.actualStart && new Date(formData.actualEnd) <= new Date(formData.actualStart)) {
          setError('End time must be after start time');
          setSaving(false);
          return;
        }
      }

      const body = {
        status: formData.status,
        title: formData.title || null,
        description: formData.description || null,
        notes: formData.notes || null,
        actualStart: toIsoFromDatetimeLocalInputValue(formData.actualStart),
        actualEnd: toIsoFromDatetimeLocalInputValue(formData.actualEnd),
      };

      const res = await fetch(`/api/visits/${visit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save changes');
        setSaving(false);
        return;
      }

      const updatedVisit = await res.json();
      setInitialFormData({ ...formData });
      onSave?.(updatedVisit);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  }, [visit, formData, onSave]);

  const handleTabChange = useCallback((nextTab) => {
    const safeTab = VISIT_MODAL_TABS.includes(nextTab) ? nextTab : 'info';
    setActiveTab(safeTab);
    onTabChange?.(safeTab);
  }, [onTabChange]);

  // BUG-6 FIX + BUG-9 FIX: Proper keyboard handlers with correct deps, no duplicate Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      // UX-13: Alt+1 through Alt+6 for tab switching
      if (e.altKey && e.key >= '1' && e.key <= '7') {
        e.preventDefault();
        const tabKeys = VISIT_MODAL_TABS;
        const idx = parseInt(e.key) - 1;
        if (tabKeys[idx]) handleTabChange(tabKeys[idx]);
        return;
      }
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleSubmit, handleTabChange, isOpen]);

  // UX-1: Intercept close with unsaved changes warning
  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmDialog({
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to discard them?',
        confirmText: 'Discard',
        confirmColor: '#EF4444',
        onConfirm: () => { setConfirmDialog(null); onClose(); },
        onCancel: () => setConfirmDialog(null),
      });
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // BUG-5 FIX: Start with confirmation
  const handleStartVisit = () => {
    setConfirmDialog({
      title: 'Start Visit',
      message: 'This will mark the visit as In Progress with the current time. Continue?',
      confirmText: 'Start Visit',
      confirmColor: '#F59E0B',
      onConfirm: async () => {
        setConfirmDialog(null);
        const now = new Date();
        const localNow = formatDatetimeLocalInputValue(now);
        const body = {
          status: 'IN_PROGRESS',
          actualStart: now.toISOString(),
        };
        try {
          const res = await fetch(`/api/visits/${visit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const updated = await res.json();
            setFormData(prev => ({ ...prev, status: 'IN_PROGRESS', actualStart: localNow }));
            setInitialFormData(prev => ({ ...prev, status: 'IN_PROGRESS', actualStart: localNow }));
            onSave?.(updated);
            fetchTabCounts(visit.id);
            fetchActivities(visit.id);
          }
        } catch {}
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  // BUG-5 FIX: Complete with confirmation
  const handleCompleteVisit = () => {
    setConfirmDialog({
      title: 'Complete Visit',
      message: 'This will mark the visit as Completed with the current time. Continue?',
      confirmText: 'Complete Visit',
      confirmColor: '#10B981',
      onConfirm: async () => {
        setConfirmDialog(null);
        const now = new Date();
        const localNow = formatDatetimeLocalInputValue(now);
        const body = {
          status: 'COMPLETED',
          actualEnd: now.toISOString(),
        };
        try {
          const res = await fetch(`/api/visits/${visit.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (res.ok) {
            const updated = await res.json();
            setFormData(prev => ({ ...prev, status: 'COMPLETED', actualEnd: localNow }));
            setInitialFormData(prev => ({ ...prev, status: 'COMPLETED', actualEnd: localNow }));
            onSave?.(updated);
            fetchTabCounts(visit.id);
            fetchActivities(visit.id);
          }
        } catch {}
      },
      onCancel: () => setConfirmDialog(null),
    });
  };

  const timeDeviationWarning = useMemo(
    () => (visit ? getVisitTimeDeviationWarning(visit) : null),
    [visit]
  );

  if (!visit) return null;

  const isTerminal = isTerminalStatus(formData.status);
  const validStatuses = getValidNextStatuses(formData.status || visit.status);
  const showStartButton = !formData.actualStart && ['SCHEDULED', 'CLOCKED_IN', 'LATE'].includes(formData.status);
  const showCompleteButton = formData.actualStart && !formData.actualEnd && ['IN_PROGRESS', 'CLOCKED_IN'].includes(formData.status);
  const showElapsedTimer = formData.actualStart && !formData.actualEnd && ['IN_PROGRESS'].includes(formData.status);

  // LOGIC-1: Max datetime = now
  const maxDatetime = formatDatetimeLocalInputValue(new Date());

  const renderInfoTab = () => (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Visit Details Card */}
      <div style={{
        border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '14px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Visit Details</h3>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            disabled={isTerminal}
            style={{
              padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              border: '2px solid var(--color-primary)', cursor: isTerminal ? 'not-allowed' : 'pointer',
              background: 'var(--color-bg)', color: 'var(--color-text)',
            }}
          >
            {validStatuses.map(s => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Client</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {visit.client?.avatar && (
              <span style={{ width: 24, height: 24, borderRadius: '50%', display: 'inline-block', backgroundImage: `url(${visit.client.avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            )}
            <span>{visit.client?.firstName} {visit.client?.lastName}</span>
          </div>
          <span style={{ color: 'var(--color-text-secondary)' }}>Address</span>
          <span>{[visit.client?.address, visit.client?.city, visit.client?.state].filter(Boolean).join(', ') || '—'}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Staff</span>
          <span>{visit.staff?.firstName} {visit.staff?.lastName}</span>
          {/* UX-8: Service name */}
          <span style={{ color: 'var(--color-text-secondary)' }}>Service</span>
          <span>{visit.service?.name || '—'}</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>Scheduled</span>
          <span>{formatDateTime(visit.startTime)} - {formatDateTime(visit.endTime)}</span>
        </div>
      </div>

      {/* Actual Visit Times */}
      <div style={{
        border: '1px solid var(--color-border)', borderRadius: '10px', padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Actual Visit Times</h4>
          {showElapsedTimer && <ElapsedTimer startTime={formData.actualStart} />}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Start Time</label>
            <input
              type="datetime-local"
              value={formData.actualStart}
              max={maxDatetime}
              onChange={(e) => setFormData(prev => ({ ...prev, actualStart: e.target.value }))}
              disabled={isTerminal}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid var(--color-border)', fontSize: '13px',
                background: isTerminal ? 'var(--color-bg-secondary)' : 'var(--color-bg)',
              }}
            />
          </div>
          <div style={{ paddingBottom: '4px' }}>
            {showStartButton && (
              <button onClick={handleStartVisit} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#F59E0B', color: 'white', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                <Clock size={14} /> Start
              </button>
            )}
            {showCompleteButton && (
              <button onClick={handleCompleteVisit} style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#10B981', color: 'white', cursor: 'pointer',
                fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                ✓ Complete
              </button>
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>End Time</label>
            <input
              type="datetime-local"
              value={formData.actualEnd}
              max={maxDatetime}
              onChange={(e) => setFormData(prev => ({ ...prev, actualEnd: e.target.value }))}
              disabled={isTerminal || !formData.actualStart}
              style={{
                width: '100%', padding: '8px 10px', borderRadius: '8px',
                border: '1px solid var(--color-border)', fontSize: '13px',
                background: (isTerminal || !formData.actualStart) ? 'var(--color-bg-secondary)' : 'var(--color-bg)',
              }}
            />
          </div>
        </div>
        {formData.actualStart && formData.actualEnd && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Duration: {formatDuration(formData.actualStart, formData.actualEnd)}
          </div>
        )}
        {timeDeviationWarning && (
          <div style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: '#FEF3C7',
            color: '#92400E',
            fontSize: '12px',
            lineHeight: 1.4,
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{timeDeviationWarning.message}</span>
          </div>
        )}
      </div>

      {/* Title — LOGIC-3: maxLength */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Title</label>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {formData.title.length}/200
          </span>
        </div>
        <input
          type="text"
          value={formData.title}
          maxLength={200}
          placeholder="e.g., Wound Care & Medication Review"
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: '1px solid var(--color-border)', fontSize: '14px',
          }}
        />
      </div>

      {/* Description — LOGIC-3 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Description</label>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {formData.description.length}/2000
          </span>
        </div>
        <textarea
          value={formData.description}
          maxLength={2000}
          placeholder="Describe the purpose of this visit..."
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: '1px solid var(--color-border)', fontSize: '14px', resize: 'vertical',
          }}
        />
      </div>

      {/* BUG-7 FIX: Renamed to "Internal Notes" with helper text */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Internal Notes</label>
          <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
            {formData.notes.length}/5000
          </span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', margin: '0 0 6px' }}>
          Private notes for scheduling/admin. For clinical visit notes, use the &ldquo;Visit Notes&rdquo; tab.
        </p>
        <textarea
          value={formData.notes}
          maxLength={5000}
          placeholder="Internal scheduling notes..."
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', borderRadius: '8px',
            border: '1px solid var(--color-border)', fontSize: '14px', resize: 'vertical',
          }}
        />
      </div>
    </div>
  );

  // LOGIC-8 + UX-15: View-only goals tab
  const renderGoalsTab = () => {
    if (!visit.carePlanId || goalsData.length === 0) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Target size={40} style={{ color: 'var(--color-text-tertiary)', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>No Care Plan Linked</h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Link a care plan to this visit to track goals and services.
          </p>
        </div>
      );
    }

    return (
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Care Plan Goals & Services</h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          borderRadius: '8px',
          background: '#FEF3C7',
          color: '#92400E',
          fontSize: '13px',
          marginBottom: '16px',
        }}>
          <AlertTriangle size={16} />
          Goal editing is view-only in this modal for now, so changes are not saved here.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {goalsData.map(goal => {
            const rawStatus = goal.status || goal.progressStatus || goal.progress?.status || 'ON_TRACK';
            const percent = Number(goal.percent ?? goal.completionPercent ?? goal.progress?.percent ?? 0);
            const notes = goal.notes || goal.progressNotes || goal.progress?.notes || '';
            const statusObj = {
              ON_TRACK: { label: 'On Track', color: '#10B981', bg: '#D1FAE5' },
              AT_RISK: { label: 'At Risk', color: '#F59E0B', bg: '#FEF3C7' },
              MET: { label: 'Met', color: '#059669', bg: '#A7F3D0' },
              NOT_MET: { label: 'Not Met', color: '#EF4444', bg: '#FEE2E2' },
            }[rawStatus] || {
              label: String(rawStatus).replace(/_/g, ' '),
              color: '#6B7280',
              bg: '#F3F4F6',
            };

            return (
              <div key={goal.id} style={{
                border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>
                      {goal.service?.name || goal.name || 'Service'}
                    </h4>
                    {goal.instructions && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                        {goal.instructions}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {goal.frequency && (
                      <span style={{
                        padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                        background: '#DBEAFE', color: '#1D4ED8', textTransform: 'uppercase',
                      }}>{goal.frequency}</span>
                    )}
                    <span style={{
                      padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                      border: `1px solid ${statusObj.color}`,
                      background: statusObj.bg, color: statusObj.color,
                    }}>
                      {statusObj.label}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Progress</span>
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{Number.isFinite(percent) ? percent : 0}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Number.isFinite(percent) ? percent : 0}%`,
                      background: statusObj.color, borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={Number.isFinite(percent) ? percent : 0}
                    disabled
                    readOnly
                    style={{ width: '100%', marginTop: '4px', opacity: 0.6 }}
                  />
                </div>

                <textarea
                  placeholder="Visit-specific notes for this goal..."
                  value={notes}
                  readOnly
                  disabled
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px', borderRadius: '6px',
                    border: '1px solid var(--color-border)', fontSize: '13px', resize: 'vertical',
                    background: 'var(--color-bg-secondary)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // UX-6: Activity timeline tab
  const renderActivitiesTab = () => (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Visit Activity Timeline</h3>
      {activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-text-secondary)' }}>
          <Clock size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
          <p>No activity recorded yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {activities.map((act, i) => (
            <div key={act.id} style={{
              display: 'flex', gap: '12px', padding: '12px 0',
              borderBottom: i < activities.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%', marginTop: '6px', flexShrink: 0,
                background: act.action.includes('COMPLETED') || act.action.includes('APPROVED')
                  ? '#10B981'
                  : act.action.includes('DELETED') || act.action.includes('CANCELLED')
                    ? '#EF4444'
                    : '#3B82F6',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                  {act.action.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                </div>
                {act.details && (
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {act.details}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                  {act.performedBy && `${act.performedBy} · `}
                  {new Date(act.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // BUG-1 FIX + BUG-8 FIX + UX-3 + UX-14 FIX
  const tabs = [
    { value: 'info', label: 'Information', icon: Info },
    { value: 'tasks', label: 'Service Tasks', icon: ListTodo, badge: tabCounts.tasks },
    { value: 'forms', label: 'Forms', icon: FileText, badge: tabCounts.forms },
    { value: 'notes', label: 'Visit Notes', icon: StickyNote, badge: tabCounts.notes },
    { value: 'goals', label: 'Goals', icon: Target },
    { value: 'activities', label: 'Timeline', icon: Clock },
    { value: 'attachments', label: 'Attachments', icon: Paperclip, badge: tabCounts.attachments },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={`Edit Visit - ${visit.client?.firstName} ${visit.client?.lastName}`}
        size="visit"
        bodyClassName="visit-modal-body"
      >
        <div className="visit-modal-shell">
          <div className="visit-modal-scroll">
            <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} variant="compact" className="visit-modal-tabs" />
            <div className="visit-modal-panel">
              {activeTab === 'info' && renderInfoTab()}
              {activeTab === 'tasks' && (
                <VisitTasksTab
                  visitId={visit?.id}
                  visitStatus={formData.status}
                  onCountChange={handleTasksCountChange}
                />
              )}
              {activeTab === 'forms' && (
                <EditVisitFormsTab
                  visitId={visit?.id}
                  visit={visit}
                  returnTo={visitReturnTo}
                  onCountChange={handleFormsCountChange}
                />
              )}
              {activeTab === 'notes' && (
                <VisitNotesTab
                  visitId={visit?.id}
                  onCountChange={handleNotesCountChange}
                />
              )}
              {activeTab === 'goals' && renderGoalsTab()}
              {activeTab === 'activities' && renderActivitiesTab()}
              {/* BUG-1 FIX: Attachments now properly rendered */}
              {activeTab === 'attachments' && (
                <FileAttachments
                  visitId={visit?.id}
                  onCountChange={handleAttachmentsCountChange}
                />
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="visit-modal-footer">
            <div className="visit-modal-footnote">
              {isDirty && <span className="visit-dirty-indicator">• Unsaved changes</span>}
              <span className={isDirty ? 'visit-shortcuts with-dirty' : 'visit-shortcuts'}>
                Alt+1-7: switch tabs · Ctrl+S: save
              </span>
            </div>
            <div className="visit-modal-actions">
              {error && (
                <span className="visit-modal-error">
                  {error}
                </span>
              )}
              <button onClick={handleClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving || !isDirty}
                className="btn btn-primary visit-save-button"
              >
                {saving ? <Clock size={16} /> : <Save size={16} />}
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* UX-9: Styled confirmation dialogs */}
      {confirmDialog && <ConfirmDialog open={true} {...confirmDialog} />}
    </>
  );
}
