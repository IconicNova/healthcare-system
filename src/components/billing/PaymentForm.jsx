'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/useToast';
import { formatCurrency } from '@/lib/utils';

const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Check', label: 'Check' },
  { value: 'Card', label: 'Credit/Debit Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
];

export default function PaymentForm({ isOpen, onClose, invoiceId, invoiceNumber, amountDue, onSuccess }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'Cash',
    referenceNumber: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }

    if (amount > amountDue) {
      showToast(`Amount cannot exceed balance due of ${formatCurrency(amountDue)}`, 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          amount,
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber || null,
          paymentDate: formData.paymentDate,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        showToast('Payment recorded successfully', 'success');
        onSuccess();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to record payment', 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast('Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Record Payment" size="md">
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          {/* Invoice Info */}
          <div style={{ padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Invoice Number</span>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>{invoiceNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Balance Due</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(amountDue)}</span>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Payment Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }}>$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                style={{ paddingLeft: '24px' }}
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Payment Method *</label>
            <Select
              value={formData.paymentMethod}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              options={PAYMENT_METHODS}
            />
          </div>

          {/* Reference Number */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Reference Number</label>
            <Input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
              placeholder="Check #, Transaction ID, etc."
            />
          </div>

          {/* Payment Date */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Payment Date *</label>
            <Input
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
              required
            />
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="textarea"
              placeholder="Optional notes..."
              style={{ fontSize: '14px' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-md">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-md">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
