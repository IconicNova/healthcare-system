'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ClientForm from './ClientForm';
import { useToast } from '@/components/ui/useToast';

const COLUMNS = [
  { key: 'fullName', label: 'Name', sortable: true, width: '200px' },
  { key: 'phone', label: 'Phone', sortable: true, width: '150px' },
  { key: 'email', label: 'Email', sortable: true, width: '200px' },
  { key: 'address', label: 'Address', sortable: true },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
  { key: 'carePlans', label: 'Care Plans', sortable: false, width: '100px' },
  { key: 'visits', label: 'Visits', sortable: false, width: '100px' },
  { key: 'actions', label: '', sortable: false, width: '120px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DISCHARGED', label: 'Discharged' },
];

const STATUS_VARIANTS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING: 'warning',
  ON_HOLD: 'error',
  DISCHARGED: 'default',
};

export default function ClientList() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);
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

      const response = await fetch(`/api/clients?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when filters change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search, statusFilter]);

  // Fetch when filters change (with debounce)
  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (e) => {
    const value = e.target?.value || e;
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderCell = (client, key) => {
    if (key === 'fullName') {
      const hasAvatar = client.avatar;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {hasAvatar ? (
            <img
              src={client.avatar}
              alt={`${client.firstName} ${client.lastName}`}
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
              {client.firstName.charAt(0)}{client.lastName.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
              {client.fullName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {client.state} {client.zipCode}
            </div>
          </div>
        </div>
      );
    }

    if (key === 'address') {
      return (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{client.address}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{client.city}</div>
        </div>
      );
    }

    if (key === 'status') {
      return <StatusBadge status={client.status} variant={STATUS_VARIANTS[client.status]} />;
    }

    if (key === 'carePlans') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {client._count?.carePlans || 0}
        </div>
      );
    }

    if (key === 'visits') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {client._count?.visits || 0}
        </div>
      );
    }

    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push(`/clients/${client.id}/edit`)}
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
            <Edit size={12} />
            Edit
          </button>
          <button
            onClick={() => router.push(`/clients/${client.id}`)}
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
            <Eye size={12} />
            View Profile
          </button>
          <button
            onClick={() => handleDeleteClick(client)}
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

    return client[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    // fetchData will be called automatically via useEffect
  };

  const handleAddClient = () => {
    setIsAddModalOpen(true);
  };

  const handleAddClientSuccess = () => {
    setIsAddModalOpen(false);
    fetchData();
    toast('success', 'Client created', 'Client has been added successfully');
  };

  const handleAddClientCancel = () => {
    setIsAddModalOpen(false);
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDeleteModalOpen(false);
        setClientToDelete(null);
        fetchData();
      } else {
        const data = await response.json();
        toast('error', 'Error', data.error || 'Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast('error', 'Error', 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Clients
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage your client information and care details
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
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '600px' }}>
          <SearchInput
            placeholder="Search by name, email, phone, city..."
            value={search}
            onChange={handleSearchChange}
            style={{ flex: 1 }}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            style={{ width: '160px' }}
          />
        </div>
        <Button onClick={handleAddClient}>
          <Plus size={16} />
          Add Client
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={clients}
        renderCell={renderCell}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        total={pagination.total}
      />

      {/* Add Client Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={handleAddClientCancel}
        title="Add New Client"
        size="xl"
      >
        <ClientForm
          onSuccess={handleAddClientSuccess}
          onCancel={handleAddClientCancel}
        />
      </Modal>

      {/* Remove Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        title="Remove Client"
        size="sm"
      >
        <div style={{ padding: '20px' }}>
          <p style={{ fontSize: '14px', color: 'var(--color-text)', marginBottom: '8px' }}>
            Are you sure you want to remove <strong>{clientToDelete?.firstName} {clientToDelete?.lastName}</strong>?
          </p>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            This action cannot be undone. All associated visits, medications, and forms will be permanently deleted.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={handleDeleteCancel}>
              Cancel
            </Button>
            <Button variant="error" onClick={handleDeleteConfirm} loading={deleting}>
              <Trash2 size={14} />
              Remove Client
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
