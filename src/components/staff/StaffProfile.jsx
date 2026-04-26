'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Edit, MoreVertical, Trash2, Upload, X } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

import StaffOverviewTab from './StaffOverviewTab';
import SkillsCertsTab from './SkillsCertsTab';
import AvailabilityGrid from './AvailabilityGrid';
import StaffScheduleTab from './StaffScheduleTab';
import StaffTimesheetsTab from './StaffTimesheetsTab';
import StaffForm from './StaffForm';
import { getStaffPayRateUnit } from '@/lib/clients-staff-review.mjs';
import { useBreadcrumbLabel } from '@/components/layout/BreadcrumbLabelsContext';

const ROLE_VARIANTS = {
  MANAGER: 'info',
  SUPERVISOR: 'cyan',
  STAFF: 'gray',
};

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'skills', label: 'Skills & Certifications' },
  { id: 'availability', label: 'Availability' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'timesheets', label: 'Timesheets' },
];

export default function StaffProfile({ staffData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [savedAvatar, setSavedAvatar] = useState(staffData?.user?.avatar || null);
  const canSetInactive = !['INACTIVE', 'TERMINATED'].includes(staffData?.status);
  const canTerminate = staffData?.status !== 'TERMINATED';
  const hasQuickActions = canSetInactive || canTerminate;
  const validTabIds = new Set(TABS.map(tab => tab.id));
  useBreadcrumbLabel(`/staff/${staffData?.id}`, staffData?.fullName || '');

  const getResolvedTab = (tabValue) => (tabValue && validTabIds.has(tabValue) ? tabValue : 'overview');

  const buildProfileUrl = ({ tab = activeTab, edit = showEditModal } = {}) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tab && tab !== 'overview') {
      params.set('tab', tab);
    } else {
      params.delete('tab');
    }

    if (edit) {
      params.set('edit', 'true');
    } else {
      params.delete('edit');
    }

    const query = params.toString();
    return query ? `/staff/${staffData.id}?${query}` : `/staff/${staffData.id}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMoreActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setShowEditModal(searchParams.get('edit') === 'true');
  }, [searchParams]);

  useEffect(() => {
    setActiveTab(getResolvedTab(searchParams.get('tab')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setSavedAvatar(staffData?.user?.avatar || null);
  }, [staffData?.user?.avatar]);

  useEffect(() => {
    if (!showEditModal || branches.length > 0) {
      return;
    }

    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches');
        if (response.ok) {
          const data = await response.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchBranches();
  }, [branches.length, showEditModal]);

  if (!staffData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Staff member not found</p>
      </div>
    );
  }

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this staff member? They will be set to INACTIVE status.')) return;
    setShowMoreActions(false);
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error deactivating staff:', error);
      alert('Failed to deactivate staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this staff member? They will be set to TERMINATED status.')) return;
    setShowMoreActions(false);
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'TERMINATED' }),
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error terminating staff:', error);
      alert('Failed to terminate staff member');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setAvatarError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError('Image size must be less than 5MB');
        return;
      }
      setAvatarError('');
      const reader = new FileReader();
      reader.onloadend = () => {
        const nextAvatar = reader.result;
        setAvatarPreview(nextAvatar);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async (avatarUrl = avatarPreview) => {
    if (!avatarUrl || !staffData?.id) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/staff/${staffData.id}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }
      const result = await response.json();
      setSavedAvatar(result.avatar || avatarUrl);
      setAvatarPreview(null);
      setAvatarError('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarError(error.message);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!staffData?.id) return;
    setAvatarUploading(true);
    try {
      const response = await fetch(`/api/staff/${staffData.id}/avatar`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove avatar');
      }
      setAvatarPreview(null);
      setSavedAvatar(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setAvatarUploading(false);
    }
  };

  const displayAvatar = avatarPreview || savedAvatar || staffData?.user?.avatar;
  const hasPendingAvatarChange = Boolean(avatarPreview);
  const getInitials = () => {
    return `${staffData.firstName?.charAt(0) || ''}${staffData.lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const handleOpenEditModal = () => {
    router.replace(buildProfileUrl({ edit: true }));
  };

  const handleCloseEditModal = () => {
    router.replace(buildProfileUrl({ edit: false }));
  };

  const handleEditSuccess = () => {
    handleCloseEditModal();
    router.refresh();
  };

  const handleTabChange = (nextTab) => {
    const resolvedTab = getResolvedTab(nextTab);
    setActiveTab(resolvedTab);
    router.replace(buildProfileUrl({ tab: resolvedTab }), { scroll: false });
  };

  const handleDiscardPendingAvatar = () => {
    setAvatarPreview(null);
    setAvatarError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '12px' }}
        >
          <ArrowLeft size={16} /> Back to Staff
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>{staffData.fullName}</h1>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <StatusBadge status={staffData.role} variant={ROLE_VARIANTS[staffData.role] || 'gray'} />
              <StatusBadge status={staffData.status} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', position: 'relative' }}>
            <button onClick={handleOpenEditModal} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              <Edit size={14} /> Edit Profile
            </button>
            {hasQuickActions && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button onClick={() => setShowMoreActions(!showMoreActions)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  <MoreVertical size={14} /> More
                </button>
                {showMoreActions && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', minWidth: '200px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 1000 }}>
                    {canSetInactive && (
                      <button onClick={handleDeactivate} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', background: 'none', border: 'none', borderBottom: canTerminate ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'var(--color-text)', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1 }}>Set status to INACTIVE</span>
                      </button>
                    )}
                    {canTerminate && (
                      <button onClick={handleTerminate} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '14px', color: 'var(--color-error)', transition: 'background-color 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <Trash2 size={14} />
                        <span style={{ fontSize: '13px', color: 'var(--color-error)', lineHeight: 1 }}>Set status to TERMINATED</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Avatar Section */}
          <div style={{ position: 'relative' }}>
            {displayAvatar ? (
              <Image
                src={displayAvatar}
                alt={`${staffData.firstName} ${staffData.lastName}`}
                unoptimized
                width={80}
                height={80}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--color-border)',
                }}
              />
            ) : (
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: 600,
                color: 'white',
                border: '3px solid var(--color-border)',
              }}>
                {getInitials()}
              </div>
            )}

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: '2px solid white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
              }}
            >
              <Upload size={10} />
            </button>

            {/* Remove button */}
            {savedAvatar && !hasPendingAvatarChange && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                title="Remove photo"
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: '2px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: avatarUploading ? 'not-allowed' : 'pointer',
                  opacity: avatarUploading ? 0.5 : 1,
                  fontSize: '10px',
                }}
              >
                <X size={10} />
              </button>
            )}
          </div>

          {/* Contact Information */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px 0' }}>Contact Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Email:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.email}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Phone:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.phone}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Employee ID:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.employeeId || 'N/A'}</span>
            </div>
            {avatarError && (
              <p style={{ fontSize: '12px', color: '#dc2626', margin: '8px 0 0 0' }}>{avatarError}</p>
            )}
            {hasPendingAvatarChange && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {avatarUploading ? 'Uploading photo...' : 'Photo ready to save'}
                </span>
                <button
                  type="button"
                  onClick={() => handleAvatarUpload()}
                  disabled={avatarUploading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-primary)', color: 'white', cursor: avatarUploading ? 'not-allowed' : 'pointer', opacity: avatarUploading ? 0.7 : 1, fontSize: '12px', fontWeight: 600 }}
                >
                  Save Photo
                </button>
                <button
                  type="button"
                  onClick={handleDiscardPendingAvatar}
                  disabled={avatarUploading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--color-border)', backgroundColor: 'white', color: 'var(--color-text)', cursor: avatarUploading ? 'not-allowed' : 'pointer', opacity: avatarUploading ? 0.7 : 1, fontSize: '12px', fontWeight: 600 }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Employment Information */}
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px 0' }}>Employment Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px', fontSize: '14px' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>Role:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.role}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Branch:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.branch?.name || 'N/A'}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Hire Date:</span>
              <span style={{ color: 'var(--color-text)' }}>{staffData.hireDate ? new Date(staffData.hireDate).toLocaleDateString() : 'N/A'}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>Pay Rate:</span>
              <span style={{ color: 'var(--color-text)' }}>${staffData.hourlyRate?.toFixed(2) || '0.00'} / {getStaffPayRateUnit(staffData.payType)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => handleTabChange(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && <StaffOverviewTab staffData={staffData} />}
        {activeTab === 'skills' && <SkillsCertsTab staffId={staffData.id} />}
        {activeTab === 'availability' && <AvailabilityGrid staffId={staffData.id} />}
        {activeTab === 'schedule' && <StaffScheduleTab staffId={staffData.id} staffName={staffData.fullName} />}
        {activeTab === 'timesheets' && <StaffTimesheetsTab staffId={staffData.id} />}
      </div>

      <Modal isOpen={showEditModal} onClose={handleCloseEditModal} title="Edit Staff Member" size="lg">
        <StaffForm
          onSuccess={handleEditSuccess}
          onCancel={handleCloseEditModal}
          branches={branches}
          staffId={staffData.id}
          initialData={{
            firstName: staffData.firstName,
            lastName: staffData.lastName,
            email: staffData.email,
            phone: staffData.phone,
            branchId: staffData.branchId || '',
            hireDate: staffData.hireDate ? new Date(staffData.hireDate).toISOString().split('T')[0] : '',
            payRate: staffData.hourlyRate || '',
            payType: staffData.payType,
            status: staffData.status,
            role: staffData.role,
            licenseNumber: staffData.licenseNumber || '',
            licenseExpiry: staffData.licenseExpiry ? new Date(staffData.licenseExpiry).toISOString().split('T')[0] : '',
            user: staffData.user,
          }}
        />
      </Modal>
    </div>
  );
}
