'use client';

import { useState, useEffect } from 'react';
import { Shield } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/useToast';
import { formatCurrency } from '@/lib/utils';

export default function InsuranceClaimForm({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [formData, setFormData] = useState({
    invoiceId: '',
    diagnosisCode: '',
    authorizationNumber: '',
    notes: '',
  });

  // Fetch invoices with insured clients
  useEffect(() => {
    if (!isOpen) return;

    const fetchInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const response = await fetch('/api/billing/invoices?limit=100');
        if (response.ok) {
          const data = await response.json();
          // Filter invoices that have clients with insurance
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoadingInvoices(false);
      }
    };

    fetchInvoices();
  }, [isOpen]);

  const handleInvoiceChange = (invoiceId) => {
    setFormData(prev => ({ ...prev, invoiceId }));
    const invoice = invoices.find(inv => inv.id === invoiceId);
    setSelectedInvoice(invoice || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.invoiceId) {
      toast('error', 'Error', 'Please select an invoice');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/insurance-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast('success', 'Success', 'Insurance claim created successfully');
        if (onSuccess) onSuccess();
        onClose();
        setFormData({ invoiceId: '', diagnosisCode: '', authorizationNumber: '', notes: '' });
        setSelectedInvoice(null);
      } else {
        const data = await response.json();
        toast('error', 'Error', data.error || 'Failed to create claim');
      }
    } catch {
      toast('error', 'Error', 'Failed to create insurance claim');
    } finally {
      setLoading(false);
    }
  };

  const invoiceOptions = [
    { value: '', label: 'Select an invoice...' },
    ...invoices.map(inv => ({
      value: inv.id,
      label: `${inv.invoiceNumber} — ${inv.clientName} (${formatCurrency(inv.amount)})`,
    })),
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Insurance Claim" size="lg">
      <form onSubmit={handleSubmit}>
        {/* Invoice Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Invoice *</label>
          <Select
            value={formData.invoiceId}
            onChange={handleInvoiceChange}
            options={invoiceOptions}
          />
          {loadingInvoices && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Loading invoices...
            </p>
          )}
        </div>

        {/* Client Insurance Info (auto-populated) */}
        {selectedInvoice && (
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-background)',
              border: '1px solid var(--color-border)',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Shield size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Client & Insurance Info
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Client</div>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{selectedInvoice.clientName}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Amount</div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(selectedInvoice.amount)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Diagnosis Code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Diagnosis Code (ICD-10)</label>
            <Input
              value={formData.diagnosisCode}
              onChange={(e) => setFormData(prev => ({ ...prev, diagnosisCode: e.target.value }))}
              placeholder="e.g. Z74.1"
            />
          </div>
          <div>
            <label className="form-label">Authorization #</label>
            <Input
              value={formData.authorizationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, authorizationNumber: e.target.value }))}
              placeholder="Prior auth number"
            />
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '24px' }}>
          <label className="form-label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional notes for the claim..."
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !formData.invoiceId}>
            {loading ? 'Creating...' : 'Create Claim'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
