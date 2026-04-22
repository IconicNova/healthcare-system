'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import InvoiceLineItems from './InvoiceLineItems';
import ImportVisitsModal from './ImportVisitsModal';
import { useToast } from '@/components/ui/useToast';
import { formatCurrency } from '@/lib/utils';

export default function InvoiceForm({ onSuccess, onCancel, invoice }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    clientId: invoice?.clientId || '',
    dueDate: invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: invoice?.notes || '',
    invoiceItems: invoice?.invoiceItems || [
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        visitId: null,
        serviceId: null,
      },
    ],
  });

  // Import visits modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100');
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients.map(c => ({
          value: c.id,
          label: `${c.firstName} ${c.lastName}`,
        })));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleLineItemsChange = (items) => {
    setFormData(prev => ({ ...prev, invoiceItems: items }));
  };

  const handleImportVisits = (selectedVisits) => {
    const existingItems = [...formData.invoiceItems];

    selectedVisits.forEach((visit) => {
      existingItems.push({
        id: Date.now() + Math.random(),
        description: visit.serviceName,
        quantity: 1,
        unitPrice: visit.rate,
        visitId: visit.id,
        serviceId: null,
      });
    });

    setFormData(prev => ({ ...prev, invoiceItems: existingItems }));
    toast('success', 'Imported', `${selectedVisits.length} visits imported`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.clientId) {
      toast('warning', 'Missing Client', 'Please select a client');
      return;
    }

    if (formData.invoiceItems.length === 0 || formData.invoiceItems.every(item => !item.description)) {
      toast('warning', 'Missing Items', 'Please add at least one line item');
      return;
    }

    setLoading(true);
    try {
      const url = invoice ? `/api/billing/invoices/${invoice.id}` : '/api/billing/invoices';
      const method = invoice ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: formData.clientId,
          dueDate: formData.dueDate,
          notes: formData.notes,
          invoiceItems: formData.invoiceItems,
        }),
      });

      if (response.ok) {
        toast('success', invoice ? 'Updated' : 'Created', 'Invoice saved successfully');
        onSuccess();
      } else {
        const error = await response.json();
        toast('error', 'Save Failed', error.error || 'Failed to save invoice');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast('error', 'Save Failed', 'Failed to save invoice');
    } finally {
      setLoading(false);
    }
  };

  // Calculate total
  const totalAmount = formData.invoiceItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  return (
    <>
      <Modal isOpen={true} onClose={onCancel} title={invoice ? 'Edit Invoice' : 'Create Invoice'} size="xl" bodyClassName="modal-body-no-scroll">
        <form onSubmit={handleSubmit}>
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {/* Client Select */}
              <div className="form-group">
                <label className="form-label">Client *</label>
                {loadingClients ? (
                  <div style={{ padding: '10px', color: 'var(--color-text-secondary)' }}>Loading...</div>
                ) : (
                  <Select
                    value={formData.clientId}
                    onChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
                    options={[{ value: '', label: 'Select a client' }, ...clients]}
                    placeholder="Select a client"
                  />
                )}
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  required
                />
              </div>
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

            {/* Line Items */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Line Items</h4>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={!formData.clientId}
                  className="btn btn-secondary btn-sm"
                  style={{ opacity: !formData.clientId ? 0.5 : 1 }}
                >
                  Import from Visits
                </button>
              </div>
              <InvoiceLineItems
                items={formData.invoiceItems}
                onChange={handleLineItemsChange}
              />
            </div>

            {/* Total Display */}
            <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-lighter)', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: 'white', opacity: 0.9 }}>Invoice Total</span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'white' }}>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={onCancel} className="btn btn-secondary btn-md">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary btn-md">
                {loading ? 'Saving...' : invoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ImportVisitsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSelect={handleImportVisits}
        clientId={formData.clientId}
      />
    </>
  );
}
