'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';

export default function BillingSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    taxRate: 0,
    paymentTerms: 30,
    invoicePrefix: 'INV',
    paymentMethods: ['cash', 'check', 'card', 'transfer'],
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/config');
      if (response.ok) {
        const data = await response.json();
        if (data.billing) {
          setConfig(data.billing);
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
        body: JSON.stringify({ billing: config }),
      });

      if (response.ok) {
        toast('success', 'Settings saved', 'Billing settings have been updated');
      } else {
        toast('error', 'Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast('error', 'Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const togglePaymentMethod = (method) => {
    setConfig(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter(m => m !== method)
        : [...prev.paymentMethods, method],
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-content">
      <h2 className="settings-section-title">Billing Settings</h2>

      <div className="settings-form-group">
        <label className="settings-form-label">Default Tax Rate (%)</label>
        <input
          type="number"
          step="0.01"
          className="input"
          value={config.taxRate}
          onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) })}
        />
        <p className="settings-form-help">Default tax rate applied to invoices</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Default Payment Terms (days)</label>
        <select
          className="select"
          value={config.paymentTerms}
          onChange={(e) => setConfig({ ...config, paymentTerms: parseInt(e.target.value) })}
        >
          <option value={15}>15 days</option>
          <option value={30}>30 days</option>
          <option value={45}>45 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
        </select>
        <p className="settings-form-help">Default payment terms for new invoices</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Invoice Number Prefix</label>
        <input
          type="text"
          className="input"
          value={config.invoicePrefix}
          onChange={(e) => setConfig({ ...config, invoicePrefix: e.target.value })}
          placeholder="INV"
        />
        <p className="settings-form-help">Prefix for automatically generated invoice numbers</p>
      </div>

      <div className="settings-form-group">
        <label className="settings-form-label">Accepted Payment Methods</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '8px' }}>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.paymentMethods.includes('cash')}
              onChange={() => togglePaymentMethod('cash')}
            />
            Cash
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.paymentMethods.includes('check')}
              onChange={() => togglePaymentMethod('check')}
            />
            Check
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.paymentMethods.includes('card')}
              onChange={() => togglePaymentMethod('card')}
            />
            Credit/Debit Card
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={config.paymentMethods.includes('transfer')}
              onChange={() => togglePaymentMethod('transfer')}
            />
            Bank Transfer
          </label>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
