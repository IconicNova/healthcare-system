'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plus, User as UserIcon, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StaffForm from './StaffForm';
import { useToast } from '@/components/ui/useToast';

const COLUMNS = [
  { key: 'fullName', label: 'Employee', sortable: true, width: '200px', headerInsetStart: '52px' },
  { key: 'role', label: 'Role', sortable: true, width: '120px', headerContentWidth: '96px' },
  { key: 'branch', label: 'Branch', sortable: true, width: '150px', headerContentWidth: '140px' },
  { key: 'phone', label: 'Phone', sortable: true, width: '140px', headerContentWidth: '100px' },
  { key: 'skills', label: 'Skills', sortable: false, width: '180px', headerContentWidth: '160px' },
  { key: 'status', label: 'Status', sortable: true, width: '120px', headerContentWidth: '64px' },
  { key: 'hireDate', label: 'Hire Date', sortable: true, width: '120px', headerContentWidth: '88px' },
  { key: 'payRate', label: 'Pay Rate', sortable: true, width: '120px', headerContentWidth: '110px' },
  { key: 'actions', label: '', sortable: false, width: '140px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TERMINATED', label: 'Terminated' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'STAFF', label: 'Staff' },
];

const STATUS_VARIANTS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  ON_LEAVE: 'warning',
  TERMINATED: 'error',
};

const ROLE_VARIANTS = {
  MANAGER: 'info',
  SUPERVISOR: 'cyan',
  STAFF: 'gray',
};

export default function StaffList() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [branches, setBranches] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      if (branchFilter) params.append('branchId', branchFilter);

      const response = await fetch(`/api/staff?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Initial fetch and when filters change
  useEffect(() => {
    fetchData();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search, statusFilter, roleFilter, branchFilter]);

  // Fetch when filters change
  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e) => {
    const value = e.target?.value || e;
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = (e) => {
    const value = e.target?.value || e;
    setRoleFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleBranchChange = (e) => {
    const value = e.target?.value || e;
    setBranchFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderCell = (member, key) => {
    if (key === 'fullName') {
      const hasAvatar = member.user?.avatar;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasAvatar ? (
            <Image
              src={member.user.avatar}
              alt={`${member.firstName} ${member.lastName}`}
              unoptimized
              width={40}
              height={40}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 600,
                color: 'white',
              }}
            >
              {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
              {member.fullName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {member.employeeId}
            </div>
          </div>
        </div>
      );
    }

    if (key === 'role') {
      return <StatusBadge status={member.role} variant={ROLE_VARIANTS[member.role] || 'gray'} />;
    }

    if (key === 'branch') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {member.branch?.name || '-'}
        </div>
      );
    }

    if (key === 'skills') {
      const skills = member.skills || [];
      if (skills.length === 0) {
        return <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No skills</span>;
      }
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {skills.slice(0, 2).map(skill => (
            <span
              key={skill.id}
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}
            >
              {skill.name}
            </span>
          ))}
          {skills.length > 2 && (
            <span style={{
              alignSelf: 'flex-start',
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-lighter)',
              color: 'white',
            }}>
              +{skills.length - 2} more
            </span>
          )}
        </div>
      );
    }

    if (key === 'status') {
      return <StatusBadge status={member.status} variant={STATUS_VARIANTS[member.status]} />;
    }

    if (key === 'hireDate') {
      return member.hireDate ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {new Date(member.hireDate).toLocaleDateString()}
        </div>
      ) : <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>-</span>;
    }

    if (key === 'payRate') {
      const payType = member.payType || 'HOURLY';
      const rate = member.hourlyRate || 0;
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          ${rate.toFixed(2)} / {payType === 'HOURLY' ? 'hr' : payType === 'PER_VISIT' ? 'visit' : 'yr'}
        </div>
      );
    }

    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push(`/staff/${member.id}?edit=true`)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-secondary)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              transition: 'background-color 0.15s ease',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => router.push(`/staff/${member.id}`)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-primary-lighter)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <UserIcon size={12} />
            View Profile
          </button>
          <button
            onClick={() => handleDeleteClick(member)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-error)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              transition: 'background-color 0.15s ease',
            }}
          >
            <Trash2 size={12} />
            Remove
          </button>
        </div>
      );
    }

    return member[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAddStaff = () => {
    setIsAddModalOpen(true);
  };

  const handleAddStaffSuccess = () => {
    setIsAddModalOpen(false);
    fetchData();
    fetchBranches();
  };

  const handleDeleteClick = (member) => {
    setStaffToDelete(member);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/staff/${staffToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setStaffToDelete(null);
        fetchData();
      } else {
        const data = await response.json();
        toast('error', 'Error', data.error || 'Failed to delete staff member');
      }
    } catch (error) {
      console.error('Error deleting staff:', error);
      toast('error', 'Error', 'Failed to delete staff member');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setStaffToDelete(null);
  };

  const branchOptions = [
    { value: '', label: 'All Branches' },
    ...branches.map(b => ({ value: b.id, label: b.name })),
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Staff & Caregivers
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage your staff members and caregivers
        </p>
      </div>

      {/* Filters and Actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '700px' }}>
          <SearchInput
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={handleSearchChange}
            style={{ flex: 1 }}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            style={{ width: '140px' }}
          />
          <Select
            value={roleFilter}
            onChange={handleRoleChange}
            options={ROLE_OPTIONS}
            style={{ width: '130px' }}
          />
          <Select
            value={branchFilter}
            onChange={handleBranchChange}
            options={branchOptions}
            style={{ width: '160px' }}
          />
        </div>
        <Button onClick={handleAddStaff}>
          <Plus size={16} />
          Add Staff Member
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={staff}
        renderCell={renderCell}
        loading={loading}
        emptyMessage="No staff members found. Add your first staff member to get started."
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        total={pagination.total}
      />

      {/* Add Staff Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Staff Member"
        size="lg"
      >
        <StaffForm
          onSuccess={handleAddStaffSuccess}
          onCancel={() => setIsAddModalOpen(false)}
          branches={branches}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Remove Staff Member"
        size="sm"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Are you sure you want to remove <strong>{staffToDelete?.firstName} {staffToDelete?.lastName}</strong>?
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            This action can be undone by creating a new staff member. Any assigned visits will be unassigned.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="error" onClick={handleDeleteConfirm} loading={deleting}>
              <Trash2 size={14} />
              Remove Staff
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
