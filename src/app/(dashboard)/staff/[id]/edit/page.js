'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import StaffForm from '@/components/staff/StaffForm';

export default function EditStaffPage({ params }) {
  const router = useRouter();
  const { id } = params;
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const [staffRes, branchesRes] = await Promise.all([
          fetch(`/api/staff/${id}`),
          fetch('/api/branches'),
        ]);

        if (staffRes.ok) {
          const data = await staffRes.json();
          setStaff(data);
        }
        if (branchesRes.ok) {
          const data = await branchesRes.json();
          setBranches(data.branches || []);
        }
      } catch (error) {
        console.error('Error fetching staff:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, [id]);

  const handleEditSuccess = () => {
    setShowEditModal(false);
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Staff member not found</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', fontSize: '14px', marginBottom: '12px' }}
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Edit Staff Profile
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          {staff.fullName}
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>Employee ID:</div>
            <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{staff.employeeId || 'N/A'}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowEditModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Edit Information
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Staff Member" size="lg">
        <StaffForm
          onSuccess={handleEditSuccess}
          onCancel={() => setShowEditModal(false)}
          branches={branches}
          staffId={staff.id}
          initialData={{
            firstName: staff.firstName,
            lastName: staff.lastName,
            email: staff.email,
            phone: staff.phone,
            branchId: staff.branchId || '',
            hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : '',
            payRate: staff.hourlyRate || '',
            payType: staff.payType,
            status: staff.status,
            role: staff.role,
            licenseNumber: staff.licenseNumber || '',
            licenseExpiry: staff.licenseExpiry ? new Date(staff.licenseExpiry).toISOString().split('T')[0] : '',
          }}
        />
      </Modal>
    </div>
  );
}
