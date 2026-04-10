'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';

export default function NotificationSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    lateClockInAlert: true,
    lateClockInThreshold: 15,
    missedVisitAlert: true,
    expiringCertWarning: true,
    expiringCertDays: 30,
    formDueReminder: true,
    formDueHours: 24,
    invoiceOverdueAlert: true,
    invoiceOverdueDays: 7,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/config');
      if (response.ok) {
        const data = await response.json();
        if (data.notifications) {
          setConfig(data.notifications);
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: config }),
      });

      if (response.ok) {
        showToast('success', 'Settings saved', 'Notification settings have been updated');
      } else {
        showToast('error', 'Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('error', 'Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-content">
      <h2 className="settings-section-title">Notification Settings</h2>

      <div className="settings-toggle">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Late Clock-in Alert</span>
          <span className="settings-toggle-description">
            Send notifications when staff clocks in late
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.lateClockInAlert}
            onChange={(e) => setConfig({ ...config, lateClockInAlert: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {config.lateClockInAlert && (
        <div className="settings-form-group" style={{ paddingLeft: '60px', marginBottom: '24px' }}>
          <label className="settings-form-label">Late Threshold (minutes)</label>
          <input
            type="number"
            className="input"
            value={config.lateClockInThreshold}
            onChange={(e) => setConfig({ ...config, lateClockInThreshold: parseInt(e.target.value) })}
          />
        </div>
      )}

      <div className="settings-toggle">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Missed Visit Alert</span>
          <span className="settings-toggle-description">
            Send notifications when visits are marked as missed
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.missedVisitAlert}
            onChange={(e) => setConfig({ ...config, missedVisitAlert: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="settings-toggle" style={{ marginTop: '16px' }}>
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Expiring Certification Warning</span>
          <span className="settings-toggle-description">
            Send warnings when staff certifications are about to expire
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.expiringCertWarning}
            onChange={(e) => setConfig({ ...config, expiringCertWarning: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {config.expiringCertWarning && (
        <div className="settings-form-group" style={{ paddingLeft: '60px', marginBottom: '24px' }}>
          <label className="settings-form-label">Days Before Expiry</label>
          <input
            type="number"
            className="input"
            value={config.expiringCertDays}
            onChange={(e) => setConfig({ ...config, expiringCertDays: parseInt(e.target.value) })}
          />
        </div>
      )}

      <div className="settings-toggle" style={{ marginTop: '16px' }}>
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Form Due Reminder</span>
          <span className="settings-toggle-description">
            Send reminders when forms are approaching their due date
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.formDueReminder}
            onChange={(e) => setConfig({ ...config, formDueReminder: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {config.formDueReminder && (
        <div className="settings-form-group" style={{ paddingLeft: '60px', marginBottom: '24px' }}>
          <label className="settings-form-label">Hours Before Due</label>
          <input
            type="number"
            className="input"
            value={config.formDueHours}
            onChange={(e) => setConfig({ ...config, formDueHours: parseInt(e.target.value) })}
          />
        </div>
      )}

      <div className="settings-toggle" style={{ marginTop: '16px' }}>
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Invoice Overdue Alert</span>
          <span className="settings-toggle-description">
            Send alerts when invoices become overdue
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.invoiceOverdueAlert}
            onChange={(e) => setConfig({ ...config, invoiceOverdueAlert: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      {config.invoiceOverdueAlert && (
        <div className="settings-form-group" style={{ paddingLeft: '60px', marginBottom: '24px' }}>
          <label className="settings-form-label">Days After Due Date</label>
          <input
            type="number"
            className="input"
            value={config.invoiceOverdueDays}
            onChange={(e) => setConfig({ ...config, invoiceOverdueDays: parseInt(e.target.value) })}
          />
        </div>
      )}

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving} style={{ marginTop: '24px' }}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
