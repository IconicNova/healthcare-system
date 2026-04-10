'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/ui/useToast';

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'America/Phoenix',
  'Pacific/Honolulu',
];

export default function OrganizationSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    timezone: 'America/New_York',
    logoUrl: '',
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/settings/organization');
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          timezone: 'America/New_York',
          logoUrl: '',
        });
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/settings/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast('success', 'Settings saved', 'Organization settings have been updated');
      } else {
        showToast('error', 'Error', 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving organization:', error);
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
      <h2 className="settings-section-title">Organization Settings</h2>

      <form onSubmit={handleSubmit}>
        <div className="settings-form-group">
          <label className="settings-form-label">Organization Name</label>
          <input
            type="text"
            className="input"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">Logo URL</label>
          <input
            type="text"
            className="input"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
          <p className="settings-form-help">Enter the URL of your organization logo</p>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">Timezone</label>
          <select
            className="select"
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">Email</label>
          <input
            type="email"
            className="input"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">Phone</label>
          <input
            type="tel"
            className="input"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">Address</label>
          <input
            type="text"
            className="input"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="settings-form-group">
            <label className="settings-form-label">City</label>
            <input
              type="text"
              className="input"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">State</label>
            <input
              type="text"
              className="input"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
        </div>

        <div className="settings-form-group">
          <label className="settings-form-label">ZIP Code</label>
          <input
            type="text"
            className="input"
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
