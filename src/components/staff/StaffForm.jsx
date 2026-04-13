'use client';

import { useState, useEffect, useRef } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { Upload, X } from 'lucide-react';
import ImageEditorModal from '@/components/ui/ImageEditorModal';

export default function StaffForm({ onSuccess, onCancel, branches = [], staffId, initialData }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    branchId: '',
    hireDate: new Date().toISOString().split('T')[0],
    payRate: '',
    payType: 'HOURLY',
    status: 'ACTIVE',
    role: 'STAFF',
    licenseNumber: '',
    licenseExpiry: '',
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageForEditing, setImageForEditing] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // Get avatar from initialData.user.avatar if available
      if (initialData.user?.avatar) {
        setAvatarPreview(initialData.user.avatar);
      }
    }
  }, [initialData]);

  const roleOptions = [
    { value: 'STAFF', label: 'Staff' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
    { value: 'MANAGER', label: 'Manager' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ON_LEAVE', label: 'On Leave' },
  ];

  const payTypeOptions = [
    { value: 'HOURLY', label: 'Hourly' },
    { value: 'PER_VISIT', label: 'Per Visit' },
    { value: 'SALARY', label: 'Salary' },
  ];

  const branchOptions = branches.map(b => ({
    value: b.id,
    label: b.name,
  }));

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setAvatarError('Please select an image file');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('Image size must be less than 5MB');
        return;
      }

      setAvatarError('');

      // Create preview for editor
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageForEditing(reader.result);
        setShowImageEditor(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (staffMemberId) => {
    if (!avatarPreview || !staffMemberId) return null;

    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/staff/${staffMemberId}/avatar`, {
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
    if (!staffId) return;

    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/avatar`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove avatar');
      }

      setAvatarPreview(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleImageEditorApply = (croppedDataUrl) => {
    setAvatarPreview(croppedDataUrl);
    setShowImageEditor(false);
    setImageForEditing(null);
  };

  const handleImageEditorClose = () => {
    setShowImageEditor(false);
    setImageForEditing(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    setError('');

    if (!formData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }
    if (!staffId && !formData.password) {
      setError('Password is required');
      return false;
    }
    if (!staffId && formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone is required');
      return false;
    }
    if (!formData.branchId) {
      setError('Branch is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        branchId: formData.branchId,
        hireDate: formData.hireDate,
        payRate: formData.payRate ? parseFloat(formData.payRate) : null,
        payType: formData.payType,
        status: formData.status,
        role: formData.role,
        licenseNumber: formData.licenseNumber || null,
        licenseExpiry: formData.licenseExpiry || null,
      };

      // Only include password if changing (not empty and not editing without password change)
      if (!staffId) {
        payload.password = formData.password;
      } else if (formData.password) {
        payload.password = formData.password;
      }

      const endpoint = staffId ? `/api/staff/${staffId}` : '/api/staff';
      const method = staffId ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${staffId ? 'update' : 'create'} staff member`);
      }

      const result = await response.json();

      // Upload avatar if there's a new one
      const targetId = staffId || result.id;
      if (avatarPreview && staffId && avatarPreview !== initialData?.user?.avatar) {
        await handleAvatarUpload(targetId);
      } else if (avatarPreview && !staffId) {
        await handleAvatarUpload(result.id);
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message || `An error occurred while ${staffId ? 'updating' : 'creating'} the staff member`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-error-light)',
          color: '#991b1b',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* Profile Picture */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Profile Picture
        </h4>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
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

            {staffId && avatarPreview && (
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
            <div style={{ marginBottom: '8px' }}>
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
              {avatarError && (
                <span style={{ color: '#dc2626', fontSize: '12px', marginLeft: '8px' }}>{avatarError}</span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Optional. JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Account Information
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            maxLength={50}
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            maxLength={50}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Input
            label={staffId ? "Password (optional)" : "Password"}
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required={!staffId}
            helperText={staffId ? 'Leave blank to keep current password' : 'Minimum 8 characters'}
            maxLength={100}
          />
          <Input
            label={staffId ? "Confirm Password (optional)" : "Confirm Password"}
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            required={!staffId}
            maxLength={100}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            options={roleOptions}
            required
          />
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text)',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          Staff Details
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            required
            maxLength={20}
            pattern="^\+?[1]?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$"
            placeholder="(416) 555-0198"
            title="Must be a valid 10-digit North American phone number"
          />
          <Select
            label="Branch"
            value={formData.branchId}
            onChange={(e) => handleInputChange('branchId', e.target.value)}
            options={branchOptions}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Input
            label="Hire Date"
            type="date"
            value={formData.hireDate}
            onChange={(e) => handleInputChange('hireDate', e.target.value)}
            min="1900-01-01"
          />
          <Input
            label="Pay Rate"
            type="number"
            step="0.01"
            value={formData.payRate}
            onChange={(e) => handleInputChange('payRate', e.target.value)}
            placeholder="0.00"
            min="0"
          />
          <Select
            label="Pay Type"
            value={formData.payType}
            onChange={(e) => handleInputChange('payType', e.target.value)}
            options={payTypeOptions}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            options={statusOptions}
          />
          <Input
            label="License Number"
            value={formData.licenseNumber}
            onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
            maxLength={50}
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <Input
            label="License Expiry"
            type="date"
            value={formData.licenseExpiry}
            onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
            min="1900-01-01"
          />
        </div>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid var(--color-border)',
      }}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {staffId ? 'Update Staff Member' : 'Create Staff Member'}
        </Button>
      </div>

      <ImageEditorModal
        isOpen={showImageEditor}
        onClose={handleImageEditorClose}
        onApply={handleImageEditorApply}
        imageSrc={imageForEditing}
      />
    </form>
  );
}
