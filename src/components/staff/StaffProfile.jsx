'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, MoreVertical, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/ui/StatusBadge';
import StaffOverviewTab from './StaffOverviewTab';
import SkillsCertsTab from './SkillsCertsTab';
import AvailabilityGrid from './AvailabilityGrid';
import StaffScheduleTab from './StaffScheduleTab';
import StaffTimesheetsTab from './StaffTimesheetsTab';

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
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  if (!staffData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Staff member not found</p>
      </div>
    );
  }

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this staff member?')) return;
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
    if (!confirm('Are you sure you want to terminate this staff member?')) return;
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

          <div style={{ position: 'relative' }} onMouseLeave={() => setShowMoreActions(false)}>
            <button onClick={() => router.push(`/staff/${staffData.id}/edit`)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
              <Edit size={14} /> Edit Profile
            </button>
            <button onClick={() => setShowMoreActions(!showMoreActions)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 500, marginLeft: '8px' }}>
              <MoreVertical size={14} /> More
            </button>
            {showMoreActions && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', minWidth: '180px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)' }}>
                <button onClick={handleDeactivate} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Deactivate</button>
                <button onClick={handleTerminate} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--color-error)' }}>
                  <Trash2 size={14} /> Terminate
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 600, color: 'white' }}>
            {staffData.firstName?.charAt(0)}{staffData.lastName?.charAt(0)}
          </div>
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
          </div>
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
              <span style={{ color: 'var(--color-text)' }}>${staffData.hourlyRate?.toFixed(2) || '0.00'} / {staffData.payType === 'HOURLY' ? 'hr' : 'yr'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
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
    </div>
  );
}
