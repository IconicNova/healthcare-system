'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ClipboardCheck } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import { buildCareDeliveryClientPath, formatInitials } from '@/components/care-delivery/care-delivery.helpers';

const COLUMNS = [
  { key: 'fullName', label: 'Client', sortable: true, headerInsetStart: '52px' },
  { key: 'phone', label: 'Phone', sortable: true, width: '150px', headerContentWidth: '100px' },
  { key: 'status', label: 'Status', sortable: true, width: '120px', headerContentWidth: '64px' },
  { key: 'upcomingVisits', label: 'Upcoming Visits', sortable: false, width: '130px', headerContentWidth: '18px' },
  { key: 'totalVisits', label: 'Visits', sortable: false, width: '100px', headerContentWidth: '18px' },
  { key: 'reviewQueue', label: 'Forms Review', sortable: false, width: '120px', headerContentWidth: '18px' },
  { key: 'actions', label: '', sortable: false, width: '180px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'DISCHARGED', label: 'Discharged' },
];

const ACTIVE_VISIT_STATUSES = new Set(['OFFERED', 'SCHEDULED', 'IN_PROGRESS', 'CLOCKED_IN']);



export default function CareDeliveryList() {
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
  const [upcomingVisitCounts, setUpcomingVisitCounts] = useState({});
  const [reviewQueueCounts, setReviewQueueCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });

        if (search) params.append('search', search);
        if (statusFilter) params.append('status', statusFilter);

        const today = new Date();
        const endRange = new Date(today);
        endRange.setDate(endRange.getDate() + 30);

        const [clientsRes, visitsRes, reviewRes] = await Promise.all([
          fetch(`/api/clients?${params.toString()}`),
          fetch(`/api/visits?startDate=${today.toISOString()}&endDate=${endRange.toISOString()}`),
          fetch('/api/forms/review'),
        ]);

        if (clientsRes.ok) {
          const data = await clientsRes.json();
          setClients(data.clients || []);
          setPagination(data.pagination);
        }

        if (visitsRes.ok) {
          const visits = await visitsRes.json();
          const counts = visits.reduce((accumulator, visit) => {
            if (!ACTIVE_VISIT_STATUSES.has(visit.status)) {
              return accumulator;
            }

            accumulator[visit.clientId] = (accumulator[visit.clientId] || 0) + 1;
            return accumulator;
          }, {});

          setUpcomingVisitCounts(counts);
        } else {
          setUpcomingVisitCounts({});
        }

        if (reviewRes.ok) {
          const data = await reviewRes.json();
          const counts = (data.forms || []).reduce((accumulator, form) => {
            const clientId = form.client?.id;
            if (!clientId) {
              return accumulator;
            }

            accumulator[clientId] = (accumulator[clientId] || 0) + 1;
            return accumulator;
          }, {});

          setReviewQueueCounts(counts);
        } else {
          setReviewQueueCounts({});
        }
      } catch (error) {
        console.error('Error fetching care delivery clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handleStatusChange = (event) => {
    const value = event.target?.value || event;
    setStatusFilter(value);
    setPagination((current) => ({ ...current, page: 1 }));
  };

  const handlePageChange = (nextPage) => {
    setPagination((current) => ({ ...current, page: nextPage }));
  };

  const renderCell = (client, key) => {
    if (key === 'fullName') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* BUG-17 FIX: Show avatar if available, otherwise initials */}
          {client.avatar ? (
            <Image
              src={client.avatar}
              alt={client.fullName || 'Client'}
              width={40}
              height={40}
              style={{
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
                flexShrink: 0,
              }}
            >
              {formatInitials(client)}
            </div>
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
              {client.fullName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {client.city}, {client.state}
            </div>
          </div>
        </div>
      );
    }

    if (key === 'status') {
      return <StatusBadge status={client.status} />;
    }

    if (key === 'upcomingVisits') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {upcomingVisitCounts[client.id] || 0}
        </div>
      );
    }

    if (key === 'totalVisits') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {client._count?.visits || 0}
        </div>
      );
    }

    if (key === 'reviewQueue') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {reviewQueueCounts[client.id] || 0}
        </div>
      );
    }

    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => router.push(buildCareDeliveryClientPath(client.id))}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
            }}
          >
            <ClipboardCheck size={12} />
            Open Care Delivery
          </button>
        </div>
      );
    }

    return client[key];
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Care Delivery
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Review client tasks, charting, and visit activity
        </p>
      </div>

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
        <Button onClick={() => router.push('/care-delivery/forms/review')}>
          <ClipboardCheck size={16} />
          Forms Review
        </Button>
      </div>

      <DataTable
        columns={COLUMNS}
        data={clients}
        renderCell={renderCell}
        loading={loading}
        emptyMessage="No clients found for care delivery."
      />

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        total={pagination.total}
      />
    </div>
  );
}
