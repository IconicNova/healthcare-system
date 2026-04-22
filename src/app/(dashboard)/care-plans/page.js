'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CarePlanForm from '@/components/care-plans/CarePlanForm';

const COLUMNS = [
  { key: 'name', label: 'Care Plan Name', sortable: true, width: '250px', headerContentWidth: '190px' },
  { key: 'client', label: 'Client', sortable: true, width: '200px', headerContentWidth: '104px' },
  { key: 'staff', label: 'Primary Staff', sortable: true, width: '180px', headerContentWidth: '104px' },
  { key: 'services', label: 'Services', sortable: false, width: '200px', headerContentWidth: '110px' },
  { key: 'startDate', label: 'Start Date', sortable: true, width: '120px', headerContentWidth: '72px' },
  { key: 'endDate', label: 'End Date', sortable: true, width: '120px', headerContentWidth: '72px' },
  { key: 'status', label: 'Status', sortable: true, width: '100px', headerContentWidth: '64px' },
  { key: 'actions', label: '', sortable: false, width: '150px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function CarePlansPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [carePlans, setCarePlans] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [services, setServices] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/care-plans?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCarePlans(data.carePlans);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching care plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [clientsRes, staffRes, servicesRes] = await Promise.all([
        fetch('/api/clients?limit=100'),
        fetch('/api/staff?limit=100'),
        fetch('/api/services'),
      ]);

      if (clientsRes.ok) setClients((await clientsRes.json()).clients || []);
      if (staffRes.ok) setStaff((await staffRes.json()).staff || []);
      if (servicesRes.ok) setServices(await servicesRes.json());
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchReferenceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const renderCell = (plan, key) => {
    if (key === 'name') {
      return (
        <div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
            {plan.name}
          </div>
          {plan.description && (
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {plan.description.substring(0, 50)}{plan.description.length > 50 ? '...' : ''}
            </div>
          )}
        </div>
      );
    }

    if (key === 'client') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {plan.client?.firstName} {plan.client?.lastName}
        </div>
      );
    }

    if (key === 'staff') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {plan.staff?.firstName} {plan.staff?.lastName}
        </div>
      );
    }

    if (key === 'services') {
      const planServices = plan.services || [];
      if (planServices.length === 0) {
        return <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>No services</span>;
      }
      return (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {planServices.slice(0, 2).map(s => (
            <span
              key={s.id}
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary-lighter)',
                color: 'white',
              }}
            >
              {s.service?.name}
            </span>
          ))}
          {planServices.length > 2 && (
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
              +{planServices.length - 2} more
            </span>
          )}
        </div>
      );
    }

    if (key === 'startDate') {
      return plan.startDate ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {new Date(plan.startDate).toLocaleDateString()}
        </div>
      ) : <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>-</span>;
    }

    if (key === 'endDate') {
      return plan.endDate ? (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {new Date(plan.endDate).toLocaleDateString()}
        </div>
      ) : <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Ongoing</span>;
    }

    if (key === 'status') {
      const status = plan.status ? 'Active' : 'Inactive';
      const variant = plan.status ? 'success' : 'default';
      return <StatusBadge status={status} variant={variant} />;
    }

    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push(`/care-plans/${plan.id}`)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-primary-lighter)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            View
          </button>
          <button
            onClick={() => router.push(`/care-plans/${plan.id}?edit=true`)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-secondary)',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDeleteCarePlan(plan.id)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#EF4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Delete
          </button>
        </div>
      );
    }

    return plan[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleAddCarePlan = () => {
    setIsAddModalOpen(true);
  };

  const handleCreateCarePlan = async (payload) => {
    try {
      const response = await fetch('/api/care-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create care plan');
      }

      await response.json();

      setIsAddModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error creating care plan:', error);
      alert('Failed to create care plan: ' + error.message);
    }
  };

  const handleDeleteCarePlan = async (id) => {
    if (!window.confirm('Are you sure you want to delete this care plan?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/care-plans/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchData();
      } else {
        const error = await response.json();
        alert('Failed to delete care plan: ' + error.message);
      }
    } catch (error) {
      console.error('Error deleting care plan:', error);
      alert('Failed to delete care plan');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Care Plans
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage client care plans and service schedules
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '600px' }}>
          <SearchInput
            placeholder="Search care plans..."
            value={search}
            onChange={handleSearchChange}
            style={{ flex: 1 }}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            style={{ width: '130px' }}
          />
        </div>
        <Button onClick={handleAddCarePlan}>
          <Plus size={16} />
          Create Care Plan
        </Button>
      </div>

      <DataTable
        columns={COLUMNS}
        data={carePlans}
        renderCell={renderCell}
        loading={loading}
        emptyMessage="No care plans found. Create your first care plan to get started."
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        total={pagination.total}
      />

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Care Plan"
        size="lg"
      >
        <CarePlanForm
          isOpen={isAddModalOpen}
          onSubmit={handleCreateCarePlan}
          onClose={() => setIsAddModalOpen(false)}
          clients={clients}
          staff={staff}
          services={services}
        />
      </Modal>
    </div>
  );
}
