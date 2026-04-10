'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, X, Upload } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_HOLD', label: 'On Hold' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select an option' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const INITIAL_FORM_STATE = {
  firstName: '',
  lastName: '',
  avatar: null,
  dateOfBirth: '',
  gender: '',
  ssn: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  status: 'PENDING',
  insuranceType: '',
  insuranceId: '',
  emergencyContacts: [{ name: '', relation: '', phone: '', email: '' }],
};

export default function ClientForm({ client = null, onSuccess, onCancel }) {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        avatar: client.avatar || null,
        dateOfBirth: client.dateOfBirth ? format(new Date(client.dateOfBirth), 'yyyy-MM-dd') : '',
        gender: client.gender || '',
        ssn: client.ssn || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        city: client.city || '',
        state: client.state || '',
        zipCode: client.zipCode || '',
        status: client.status || 'PENDING',
        insuranceType: client.insuranceType || '',
        insuranceId: client.insuranceId || '',
        emergencyContacts: client.emergencyContacts?.length
          ? client.emergencyContacts
          : [{ name: '', relation: '', phone: '', email: '' }],
      });
      setAvatarPreview(client.avatar || null);
      setLoading(false);
    }
  }, [client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, avatar: 'Image size must be less than 5MB' }));
        return;
      }

      setErrors(prev => ({ ...prev, avatar: '' }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarPreview || !client?.id) return null;

    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: avatarPreview }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }

      return await response.json();
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!client?.id) return;

    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/avatar`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove avatar');
      }

      setAvatarPreview(null);
      setFormData(prev => ({ ...prev, avatar: null }));
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData(prev => ({ ...prev, emergencyContacts: updatedContacts }));
  };

  const addEmergencyContact = () => {
    setFormData(prev => ({
      ...prev,
      emergencyContacts: [...prev.emergencyContacts, { name: '', relation: '', phone: '', email: '' }],
    }));
  };

  const removeEmergencyContact = (index) => {
    if (formData.emergencyContacts.length > 1) {
      setFormData(prev => ({
        ...prev,
        emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== index),
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip Code is required';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      // Upload avatar first if there's a new one for existing client
      if (client?.id && avatarPreview && avatarPreview !== client.avatar) {
        await handleAvatarUpload();
      }

      const endpoint = client ? `/api/clients/${client.id}` : '/api/clients';
      const method = client ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          emergencyContacts: formData.emergencyContacts.filter(c => c.name.trim()),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save client');
      }

      const result = await response.json();

      // If new client with avatar, upload it
      if (!client && avatarPreview) {
        await fetch(`/api/clients/${result.id}/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatarUrl: avatarPreview }),
        });
      }

      // If onSuccess callback exists (modal mode), use it; otherwise navigate (page mode)
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/clients/${result.id}`);
      }
    } catch (error) {
      console.error('Error saving client:', error);
      setErrors({ submit: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const isModalMode = !!onSuccess;

  return (
    <div style={{ maxWidth: isModalMode ? '100%' : '800px' }}>
      {!isModalMode && (
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {client ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {client ? 'Update client information' : 'Enter client details'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ maxWidth: '100%', overflow: 'hidden' }}>
          <div className="card-body" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'auto' }}>
            {errors.submit && (
              <div style={{ padding: '12px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px' }}>
                {errors.submit}
              </div>
            )}

            {/* Profile Picture */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Profile Picture
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile preview"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--color-border)',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 600,
                    border: '3px solid var(--color-border)',
                  }}>
                    {(formData.firstName?.charAt(0) || '') + (formData.lastName?.charAt(0) || '')}
                  </div>
                )}

                {client && avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: '2px solid white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: avatarUploading ? 'not-allowed' : 'pointer',
                      opacity: avatarUploading ? 0.5 : 1,
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    style={{ marginRight: '8px' }}
                  >
                    <Upload size={14} />
                    Upload Photo
                  </Button>
                  {errors.avatar && (
                    <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>{errors.avatar}</span>
                  )}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                  Optional. JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            {/* Personal Information */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Personal Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="First Name"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                error={errors.firstName}
                required
              />
              <Input
                label="Last Name"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                error={errors.lastName}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="Date of Birth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
              />
              <Select
                label="Gender"
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                options={GENDER_OPTIONS}
              />
              <Input
                label="SSN"
                value={formData.ssn}
                onChange={(e) => handleChange('ssn', e.target.value)}
                placeholder="XXX-XX-XXXX"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                error={errors.phone}
                required
              />
            </div>

            {/* Address */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', marginTop: '24px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Address
            </h3>

            <Input
              label="Street Address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              error={errors.address}
              required
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="City"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                error={errors.city}
                required
              />
              <Input
                label="State"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                error={errors.state}
                required
                maxLength={2}
              />
              <Input
                label="Zip Code"
                value={formData.zipCode}
                onChange={(e) => handleChange('zipCode', e.target.value)}
                error={errors.zipCode}
                required
              />
            </div>

            {/* Status & Insurance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <Select
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                options={STATUS_OPTIONS}
              />
              <Input
                label="Insurance Type"
                value={formData.insuranceType}
                onChange={(e) => handleChange('insuranceType', e.target.value)}
              />
              <Input
                label="Insurance ID"
                value={formData.insuranceId}
                onChange={(e) => handleChange('insuranceId', e.target.value)}
              />
            </div>

            {/* Emergency Contacts */}
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Emergency Contacts
            </h3>

            <div style={{ marginBottom: '16px' }}>
              {formData.emergencyContacts.map((contact, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr auto', gap: '12px', alignItems: 'end', marginBottom: '12px', padding: '12px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                  <Input
                    label="Name"
                    value={contact.name}
                    onChange={(e) => handleEmergencyContactChange(index, 'name', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <Input
                    label="Relation"
                    value={contact.relation}
                    onChange={(e) => handleEmergencyContactChange(index, 'relation', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <Input
                    label="Phone"
                    value={contact.phone}
                    onChange={(e) => handleEmergencyContactChange(index, 'phone', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => handleEmergencyContactChange(index, 'email', e.target.value)}
                    style={{ marginBottom: 0 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(index)}
                    disabled={formData.emergencyContacts.length === 1}
                    style={{
                      padding: '10px',
                      border: 'none',
                      borderRadius: '6px',
                      backgroundColor: formData.emergencyContacts.length === 1 ? '#e5e7eb' : '#fee2e2',
                      color: formData.emergencyContacts.length === 1 ? '#9ca3af' : '#dc2626',
                      cursor: formData.emergencyContacts.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addEmergencyContact} style={{ marginTop: '8px' }}>
                <Plus size={14} />
                Add Emergency Contact
              </Button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--color-border)' }}>
              <Button type="button" variant="secondary" onClick={onCancel || (() => router.back())}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
