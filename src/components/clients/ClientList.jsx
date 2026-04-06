'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

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
];

const STATUS_VARIANTS = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  PENDING: 'warning',
  ON_HOLD: 'error',
};

export default function ClientList() {
  const router = useRouter();
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
  }, [pagination.page, pagination.limit, search, statusFilter]);

  // Fetch when filters change (with debounce)
  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderCell = (client, key) => {
    if (key === 'fullName') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              color: 'var(--color-primary)',
            }}
          >
            {client.firstName.charAt(0)}{client.lastName.charAt(0)}
          </div>
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
            <Edit size={12} />
            Edit
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
        <Button onClick={() => router.push('/clients/new')}>
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
    </div>
  );
}
