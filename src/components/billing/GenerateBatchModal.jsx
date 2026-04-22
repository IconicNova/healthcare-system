'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/useToast';
import { formatCurrency } from '@/lib/utils';

export default function GenerateBatchModal({ isOpen, onClose, onSuccess }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    selectedClientIds: [],
  });

  const [preview, setPreview] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Set default date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      setFormData({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        selectedClientIds: [],
      });
    }
  }, [isOpen]);

  const handlePreview = async () => {
    if (!formData.startDate || !formData.endDate) {
      toast('warning', 'Missing Dates', 'Please select a date range');
      return;
    }

    setPreviewLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: formData.startDate,
        endDate: formData.endDate,
      });
      const response = await fetch(`/api/billing/invoices/uninvoiced-visits?${params}`);

      if (response.ok) {
        const data = await response.json();
        setPreview(data.groupedByClient || []);
      }
    } catch (error) {
      console.error('Error fetching preview:', error);
      toast('error', 'Preview Failed', 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleClientSelection = (clientId) => {
    setFormData(prev => ({
      ...prev,
      selectedClientIds: prev.selectedClientIds.includes(clientId)
        ? prev.selectedClientIds.filter(id => id !== clientId)
        : [...prev.selectedClientIds, clientId],
    }));
  };

  const selectAllClients = () => {
    setFormData(prev => ({
      ...prev,
      selectedClientIds: preview.map(c => c.clientId),
    }));
  };

  const handleGenerate = async () => {
    if (formData.selectedClientIds.length === 0) {
      toast('warning', 'No Selection', 'Please select at least one client');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/invoices/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: formData.selectedClientIds,
          startDate: formData.startDate,
          endDate: formData.endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast('success', 'Generated', data.message);
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast('error', 'Generation Failed', error.error || 'Failed to generate invoices');
      }
    } catch (error) {
      console.error('Error generating batch invoices:', error);
      toast('error', 'Generation Failed', 'Failed to generate invoices');
    } finally {
      setLoading(false);
    }
  };

  const totalSelectedClients = preview.filter(c => formData.selectedClientIds.includes(c.clientId)).length;
  const totalSelectedVisits = preview
    .filter(c => formData.selectedClientIds.includes(c.clientId))
    .reduce((sum, c) => sum + c.visits.length, 0);
  const totalSelectedAmount = preview
    .filter(c => formData.selectedClientIds.includes(c.clientId))
    .reduce((sum, c) => sum + c.totalAmount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Invoices from Visits" size="lg">
      <div className="modal-body">
        {/* Date Range Selection */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '20px' }}>
          <div className="form-group">
            <label className="form-label">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="input"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              className="input"
              style={{ width: '100%' }}
            />
          </div>
          <Button onClick={handlePreview} loading={previewLoading}>
            Preview
          </Button>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={selectAllClients}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  cursor: 'pointer',
                }}
              >
                Select All
              </button>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', alignSelf: 'center' }}>
                {totalSelectedClients} of {preview.length} clients selected
              </span>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                  <tr>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px', width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={formData.selectedClientIds.length === preview.length}
                        onChange={() =>
                          setFormData(prev => ({
                            ...prev,
                            selectedClientIds: prev.selectedClientIds.length === preview.length
                              ? []
                              : preview.map(c => c.clientId),
                          }))
                        }
                      />
                    </th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Client</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Visits</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Hours</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '8px 12px' }}>Est. Total</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((client) => {
                    const isSelected = formData.selectedClientIds.includes(client.clientId);
                    return (
                      <tr
                        key={client.clientId}
                        style={{
                          backgroundColor: isSelected ? 'var(--color-primary-lighter)' : 'transparent',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleClientSelection(client.clientId)}
                      >
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleClientSelection(client.clientId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 500 }}>{client.clientName}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{client.visits.length}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{client.totalHours.toFixed(2)} hrs</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' }}>{formatCurrency(client.totalAmount)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            {totalSelectedClients > 0 && (
              <div style={{ padding: '12px', backgroundColor: 'var(--color-primary-lighter)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'white', opacity: 0.9 }}>
                    {totalSelectedClients} clients • {totalSelectedVisits} visits
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>{formatCurrency(totalSelectedAmount)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-secondary btn-md">
            Cancel
          </button>
          <Button
            onClick={handleGenerate}
            disabled={loading || formData.selectedClientIds.length === 0}
            style={{ opacity: formData.selectedClientIds.length === 0 ? 0.5 : 1 }}
          >
            {loading ? 'Generating...' : `Generate Invoices (${totalSelectedClients})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
