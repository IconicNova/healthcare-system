'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';

export default function SchedulingRules() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    defaultShiftLength: 8,
    maxOvertimeHours: 10,
    clockInWindow: 15,
    lateThreshold: 6,
    requireGPS: true,
    autoCancelHours: 24,
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/config');
      if (response.ok) {
        const data = await response.json();
        if (data.scheduling) {
          setConfig(data.scheduling);
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
        body: JSON.stringify({ scheduling: config }),
      });

      if (response.ok) {
        showToast('success', 'Settings saved', 'Scheduling rules have been updated');
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
      <h2 className="settings-section-title">Scheduling Rules</h2>

      <div className="settings-form-group">
        <label className="settings-form-label">Default Shift Length</label>
        <select
          className="select"
          value={config.defaultShiftLength}
          onChange={(e) => setConfig({ ...config, defaultShiftLength: parseInt(e.target.value) })}
        >
          <option value={4}>4 hours</option>
          <option value={6}>6 hours</option>
          <option value={8}>8 hours</option>
          <option value={10}>10 hours</option>
          <option value={12}>12 hours</option>
        </select>
        <p className="settings-form-help">Default duration for staff shifts</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Maximum Overtime Hours per Week</label>
        <input
          type="number"
          className="input"
          value={config.maxOvertimeHours}
          onChange={(e) => setConfig({ ...config, maxOvertimeHours: parseInt(e.target.value) })}
        />
        <p className="settings-form-help">Maximum overtime hours allowed per week</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Clock-in Window (minutes before scheduled)</label>
        <select
          className="select"
          value={config.clockInWindow}
          onChange={(e) => setConfig({ ...config, clockInWindow: parseInt(e.target.value) })}
        >
          <option value={5}>5 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
        </select>
        <p className="settings-form-help">Staff can clock in this many minutes before their scheduled start time</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Late Threshold (minutes)</label>
        <select
          className="select"
          value={config.lateThreshold}
          onChange={(e) => setConfig({ ...config, lateThreshold: parseInt(e.target.value) })}
        >
          <option value={1}>1 minute</option>
          <option value={5}>5 minutes</option>
          <option value={6}>6 minutes</option>
          <option value={10}>10 minutes</option>
          <option value={15}>15 minutes</option>
        </select>
        <p className="settings-form-help">Visits are marked as late if staff clocks in after this threshold</p>
      </div>

      <div className="settings-toggle">
        <div className="settings-toggle-label">
          <span className="settings-toggle-title">Require GPS for Clock-in</span>
          <span className="settings-toggle-description">Staff must provide GPS location when clocking in</span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={config.requireGPS}
            onChange={(e) => setConfig({ ...config, requireGPS: e.target.checked })}
          />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="settings-form-group" style={{ marginTop: '16px' }}>
        <label className="settings-form-label">Auto-cancel Visits After (hours past scheduled)</label>
        <select
          className="select"
          value={config.autoCancelHours}
          onChange={(e) => setConfig({ ...config, autoCancelHours: parseInt(e.target.value) })}
        >
          <option value={2}>2 hours</option>
          <option value={4}>4 hours</option>
          <option value={8}>8 hours</option>
          <option value={24}>24 hours</option>
        </select>
        <p className="settings-form-help">Automatically cancel visits that haven&apos;t started after this time</p>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
