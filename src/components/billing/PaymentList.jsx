'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/ui/DataTable';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { CreditCard, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import PaymentForm from './PaymentForm';

const COLUMNS = [
  { key: 'paymentDate', label: 'Date', sortable: true, width: '120px' },
  { key: 'invoiceNumber', label: 'Invoice #', sortable: true, width: '140px' },
  { key: 'clientName', label: 'Client', sortable: true, width: '180px' },
  { key: 'amount', label: 'Amount', sortable: true, width: '120px' },
  { key: 'paymentMethod', label: 'Method', sortable: true, width: '120px' },
  { key: 'referenceNumber', label: 'Reference', sortable: true, width: '150px' },
];

export default function PaymentList({ onPaymentRecorded }) {
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/billing/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setPagination(data.pagination);
        setTotalAmount(data.totalAmount);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  const renderCell = (payment, key) => {
    if (key === 'paymentDate') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={12} color="var(--color-text-secondary)" />
          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatDate(payment.paymentDate)}</span>
        </div>
      );
    }

    if (key === 'invoiceNumber') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
          {payment.invoiceNumber}
        </div>
      );
    }

    if (key === 'clientName') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
          {payment.clientName}
        </div>
      );
    }

    if (key === 'amount') {
      return (
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
          {formatCurrency(payment.amount)}
        </div>
      );
    }

    if (key === 'paymentMethod') {
      return (
        <span className={`payment-method-badge ${payment.paymentMethod.toLowerCase()}`}>
          {payment.paymentMethod}
        </span>
      );
    }

    if (key === 'referenceNumber') {
      return (
        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
          {payment.referenceNumber || '-'}
        </div>
      );
    }

    return payment[key];
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRecordPayment = (invoice = null) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  return (
    <div>
      {/* Header with Total and Record Payment button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Payment History</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            Total: <span style={{ fontWeight: 600 }}>{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        <Button onClick={() => handleRecordPayment(null)} icon={CreditCard}>
          Record Payment
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={COLUMNS}
        data={payments}
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

      {/* Payment Form Modal */}
      {isPaymentModalOpen && selectedInvoice && (
        <PaymentForm
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoiceId={selectedInvoice.id}
          invoiceNumber={selectedInvoice.invoiceNumber}
          amountDue={selectedInvoice.balanceDue}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            fetchData();
            if (onPaymentRecorded) onPaymentRecorded();
          }}
        />
      )}
    </div>
  );
}
