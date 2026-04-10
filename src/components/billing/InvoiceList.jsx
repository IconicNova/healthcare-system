'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/ui/DataTable';
import SearchInput from '@/components/ui/SearchInput';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { Eye } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

const COLUMNS = [
  { key: 'invoiceNumber', label: 'Invoice #', sortable: true, width: '140px' },
  { key: 'clientName', label: 'Client', sortable: true, width: '200px' },
  { key: 'amount', label: 'Amount', sortable: true, width: '120px' },
  { key: 'dueDate', label: 'Due Date', sortable: true, width: '120px' },
  { key: 'status', label: 'Status', sortable: true, width: '100px' },
  { key: 'actions', label: '', sortable: false, width: '80px' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'SENT', label: 'Sent' },
  { value: 'PAID', label: 'Paid' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SENT: 'primary',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'error',
};

export default function InvoiceList({ onInvoiceClick }) {
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
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

      const response = await fetch(`/api/billing/invoices?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const renderCell = (invoice, key) => {
    if (key === 'invoiceNumber') {
      return (
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {invoice.invoiceNumber}
        </div>
      );
    }

    if (key === 'clientName') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {invoice.clientName}
        </div>
      );
    }

    if (key === 'amount') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          {formatCurrency(invoice.amount)}
        </div>
      );
    }

    if (key === 'dueDate') {
      const isOverdue = invoice.status === 'OVERDUE' || (new Date(invoice.dueDate) < new Date());
      return (
        <div style={{ fontSize: '13px', color: isOverdue ? 'var(--color-error)' : 'var(--color-text)' }}>
          {formatDate(invoice.dueDate)}
        </div>
      );
    }

    if (key === 'status') {
      return <StatusBadge status={invoice.status} variant={STATUS_VARIANTS[invoice.status]} />;
    }

    if (key === 'actions') {
      return (
        <button
          onClick={() => onInvoiceClick(invoice)}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'var(--color-primary-lighter)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s ease',
          }}
          title="View Invoice"
        >
          <Eye size={14} />
        </button>
      );
    }

    return invoice[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <SearchInput
          placeholder="Search by invoice number or client name..."
          value={search}
          onChange={handleSearchChange}
          style={{ flex: 1, minWidth: '200px' }}
        />
        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          options={STATUS_OPTIONS}
          style={{ width: '150px' }}
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={invoices}
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
