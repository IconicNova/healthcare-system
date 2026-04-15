'use client';

import { useState, useEffect } from 'react';
import { Eye, Plus, Send } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

const COLUMNS = [
  { key: 'claimNumber', label: 'Claim #', sortable: true, width: '140px' },
  { key: 'clientName', label: 'Client', sortable: true, width: '160px' },
  { key: 'insuranceType', label: 'Insurance', sortable: true, width: '130px' },
  { key: 'invoiceNumber', label: 'Invoice #', sortable: false, width: '130px' },
  { key: 'serviceDate', label: 'Service Date', sortable: true, width: '120px' },
  { key: 'amount', label: 'Amount', sortable: true, width: '110px' },
  { key: 'approvedAmount', label: 'Approved', sortable: false, width: '110px' },
  { key: 'status', label: 'Status', sortable: true, width: '120px' },
  { key: 'actions', label: '', sortable: false, width: '120px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'DENIED', label: 'Denied' },
  { value: 'APPEALED', label: 'Appealed' },
  { value: 'PAID', label: 'Paid' },
  { value: 'VOIDED', label: 'Voided' },
];

const CLAIM_STATUS_COLORS = {
  PENDING: 'warning',
  SUBMITTED: 'primary',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  DENIED: 'error',
  APPEALED: 'warning',
  PAID: 'success',
  VOIDED: 'default',
};

export default function InsuranceClaimList({ onClaimClick, onCreateClaim }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [claims, setClaims] = useState([]);
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

      const response = await fetch(`/api/billing/insurance-claims?${params}`);
      if (response.ok) {
        const data = await response.json();
        setClaims(data.claims);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast('error', 'Error', 'Failed to load insurance claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const handleStatusUpdate = async (claim, newStatus) => {
    try {
      const response = await fetch(`/api/billing/insurance-claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast('success', 'Success', `Claim ${newStatus.toLowerCase().replace('_', ' ')} successfully`);
        fetchData();
      } else {
        const data = await response.json();
        toast('error', 'Error', data.error || 'Failed to update claim');
      }
    } catch {
      toast('error', 'Error', 'Failed to update claim');
    }
  };

  const renderCell = (claim, key) => {
    if (key === 'claimNumber') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>
          {claim.claimNumber}
        </div>
      );
    }

    if (key === 'clientName') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {claim.clientName}
        </div>
      );
    }

    if (key === 'insuranceType') {
      return (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
            {claim.insuranceType}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
            ID: {claim.insuranceId}
          </div>
        </div>
      );
    }

    if (key === 'invoiceNumber') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {claim.invoiceNumber}
        </div>
      );
    }

    if (key === 'serviceDate') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {formatDate(claim.serviceDate)}
        </div>
      );
    }

    if (key === 'amount') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          {formatCurrency(claim.amount)}
        </div>
      );
    }

    if (key === 'approvedAmount') {
      if (claim.approvedAmount != null) {
        return (
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-success)' }}>
            {formatCurrency(claim.approvedAmount)}
          </div>
        );
      }
      return <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>—</div>;
    }

    if (key === 'status') {
      const statusLabels = {
        PENDING: 'Pending',
        SUBMITTED: 'Submitted',
        IN_REVIEW: 'In Review',
        APPROVED: 'Approved',
        DENIED: 'Denied',
        APPEALED: 'Appealed',
        PAID: 'Paid',
        VOIDED: 'Voided',
      };
      return (
        <span className={`badge badge-${CLAIM_STATUS_COLORS[claim.status] || 'gray'}`}>
          {statusLabels[claim.status] || claim.status}
        </span>
      );
    }

    if (key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => onClaimClick && onClaimClick(claim)}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'var(--color-primary-lighter)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title="View Details"
          >
            <Eye size={13} />
          </button>
          {claim.status === 'PENDING' && (
            <button
              onClick={() => handleStatusUpdate(claim, 'SUBMITTED')}
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-info, #3b82f6)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Submit Claim"
            >
              <Send size={13} />
            </button>
          )}
        </div>
      );
    }

    return claim[key];
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-end' }}>
        <SearchInput
          placeholder="Search by claim #, client, or insurance..."
          value={search}
          onChange={(val) => { setSearch(val); setPagination(prev => ({ ...prev, page: 1 })); }}
          style={{ flex: 1, minWidth: '250px' }}
        />
        <div style={{ minWidth: '180px' }}>
          <Select
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setPagination(prev => ({ ...prev, page: 1 })); }}
            options={STATUS_OPTIONS}
            style={{ width: '100%' }}
            inline
          />
        </div>
        {onCreateClaim && (
          <Button onClick={onCreateClaim} icon={Plus} style={{ whiteSpace: 'nowrap' }}>
            New Claim
          </Button>
        )}
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={claims}
        renderCell={renderCell}
        loading={loading}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
        total={pagination.total}
      />
    </div>
  );
}
