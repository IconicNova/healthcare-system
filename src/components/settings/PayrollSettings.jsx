'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';

export default function PayrollSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    overtimeThreshold: 40,
    overtimeMultiplier: 1.5,
    mileageRate: 0.67,
    payPeriod: 'biweekly',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/config');
      if (response.ok) {
        const data = await response.json();
        if (data.payroll) {
          setConfig(data.payroll);
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
        body: JSON.stringify({ payroll: config }),
      });

      if (response.ok) {
        showToast('success', 'Settings saved', 'Payroll settings have been updated');
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
      <h2 className="settings-section-title">Payroll Settings</h2>

      <div className="settings-form-group">
        <label className="settings-form-label">Overtime Threshold (hours/week)</label>
        <input
          type="number"
          className="input"
          value={config.overtimeThreshold}
          onChange={(e) => setConfig({ ...config, overtimeThreshold: parseInt(e.target.value) })}
        />
        <p className="settings-form-help">Hours worked beyond this threshold are paid at overtime rate</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Overtime Rate Multiplier</label>
        <input
          type="number"
          step="0.1"
          className="input"
          value={config.overtimeMultiplier}
          onChange={(e) => setConfig({ ...config, overtimeMultiplier: parseFloat(e.target.value) })}
        />
        <p className="settings-form-help">Overtime hours are multiplied by this rate (e.g., 1.5 for time and a half)</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Mileage Rate ($/mile)</label>
        <input
          type="number"
          step="0.01"
          className="input"
          value={config.mileageRate}
          onChange={(e) => setConfig({ ...config, mileageRate: parseFloat(e.target.value) })}
        />
        <p className="settings-form-help">Rate used for mileage reimbursement</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Pay Period</label>
        <select
          className="select"
          value={config.payPeriod}
          onChange={(e) => setConfig({ ...config, payPeriod: e.target.value })}
        >
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <p className="settings-form-help">Frequency of payroll processing</p>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
