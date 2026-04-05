'use client';

import { useEffect, useState } from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { FileText, ExternalLink } from 'lucide-react';

export default function RecentInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch('/api/dashboard/recent-invoices');
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices);
        }
      } catch (error) {
        console.error('Error fetching recent invoices:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'OVERDUE':
        return 'error';
      case 'SENT':
        return 'primary';
      case 'DRAFT':
        return 'default';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Recent Invoices
          </h3>
          <div style={{ height: '200px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Recent Invoices
          </h3>
          <a
            href="/billing/invoices"
            style={{ fontSize: '13px', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}
          >
            View All
          </a>
        </div>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              No invoices found
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Invoice #
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Client
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Amount
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Due Date
                  </th>
                  <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    style={{
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={14} color="var(--color-text-secondary)" />
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>
                          {invoice.invoiceNumber}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                        {invoice.clientName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        {invoice.createdAt}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {invoice.formattedAmount}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontSize: '13px', color: invoice.status === 'OVERDUE' ? 'var(--color-error)' : 'var(--color-text)' }}>
                        {invoice.dueDate}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <StatusBadge status={invoice.status} variant={getStatusVariant(invoice.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
