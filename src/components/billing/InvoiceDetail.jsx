'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import Button from '@/components/ui/Button';
import PaymentForm from './PaymentForm';
import { Edit, Send, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate, hasRoleAccess } from '@/lib/utils';
import { useSession } from '@/lib/auth';

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SENT: 'primary',
  PAID: 'success',
  OVERDUE: 'error',
  CANCELLED: 'error',
};

export default function InvoiceDetail({ invoice, onClose }) {
  const { data: session } = useSession();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  if (!invoice) return null;

  const canEdit = hasRoleAccess(session?.user?.role, ['ADMIN', 'MANAGER']);
  const isDraft = invoice.status === 'DRAFT';

  const handleRecordPayment = () => {
    setIsPaymentModalOpen(true);
  };

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title="Invoice Details" size="lg">
        <div className="modal-body">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{invoice.invoiceNumber}</h3>
                <StatusBadge status={invoice.status} variant={STATUS_VARIANTS[invoice.status]} />
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
                {invoice.clientName}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '4px' }}>
                {formatCurrency(invoice.amount)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Balance: {formatCurrency(invoice.balanceDue || 0)}
              </div>
            </div>
          </div>

          {/* Invoice Info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Due Date</p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0 0' }}>{formatDate(invoice.dueDate)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Created</p>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0 0' }}>{formatDate(invoice.createdAt)}</p>
            </div>
            {invoice.paidDate && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Paid Date</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0 0' }}>{formatDate(invoice.paidDate)}</p>
              </div>
            )}
            {invoice.userName && (
              <div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Created By</p>
                <p style={{ fontSize: '14px', fontWeight: 500, margin: '4px 0 0' }}>{invoice.userName}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>Notes</p>
              <p style={{ fontSize: '14px', margin: '4px 0 0' }}>{invoice.notes}</p>
            </div>
          )}

          {/* Line Items */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Line Items</h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Description</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Qty</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Rate</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.invoiceItems?.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{item.description}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{item.quantity}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatCurrency(item.unitPrice)}</div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{formatCurrency(item.amount)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Payment History</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Date</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Method</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Reference</th>
                      <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.payments.map((payment) => (
                      <tr key={payment.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatDate(payment.paymentDate)}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={`payment-method-badge ${payment.paymentMethod.toLowerCase()}`}>
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{payment.referenceNumber || '-'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)' }}>{formatCurrency(payment.amount)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
            {isDraft && canEdit && (
              <Button variant="secondary" icon={Edit}>
                Edit
              </Button>
            )}
            {isDraft && canEdit && (
              <Button icon={Send}>
                Send Invoice
              </Button>
            )}
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && canEdit && (
              <Button onClick={handleRecordPayment} icon={CreditCard}>
                Record Payment
              </Button>
            )}
            {invoice.status === 'PAID' && (
              <Button variant="secondary">
                Print Invoice
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {isPaymentModalOpen && (
        <PaymentForm
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          amountDue={invoice.balanceDue}
          onSuccess={() => {
            setIsPaymentModalOpen(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
