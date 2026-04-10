'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

export default function ImportVisitsModal({ clientId, isOpen, onClose, onSelect }) {
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState([]);
  const [selectedVisits, setSelectedVisits] = useState([]);
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen && clientId) {
      fetchVisits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, clientId]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/billing/invoices/uninvoiced-visits?clientId=${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setVisits(data.visits);
        setSelectedVisits([]);
      }
    } catch (error) {
      console.error('Error fetching uninvoiced visits:', error);
      showToast('Failed to fetch visits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisitSelection = (visitId) => {
    setSelectedVisits(prev =>
      prev.includes(visitId)
        ? prev.filter(id => id !== visitId)
        : [...prev, visitId]
    );
  };

  const selectAll = () => {
    setSelectedVisits(visits.map(v => v.id));
  };

  const deselectAll = () => {
    setSelectedVisits([]);
  };

  const handleImport = () => {
    if (selectedVisits.length === 0) {
      showToast('Please select at least one visit', 'warning');
      return;
    }

    const selectedVisitData = visits.filter(v => selectedVisits.includes(v.id));
    onSelect(selectedVisitData);
    onClose();
  };

  const totalSelectedHours = visits
    .filter(v => selectedVisits.includes(v.id))
    .reduce((sum, v) => sum + v.hours, 0);

  const totalSelectedAmount = visits
    .filter(v => selectedVisits.includes(v.id))
    .reduce((sum, v) => sum + v.amount, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Visits to Invoice" size="lg">
      <div className="modal-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            Loading visits...
          </div>
        ) : visits.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            No uninvoiced visits found for this client.
          </div>
        ) : (
          <>
            {/* Select all controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={selectAll}
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
              <button
                onClick={deselectAll}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  cursor: 'pointer',
                }}
              >
                Deselect All
              </button>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                {selectedVisits.length} selected
              </span>
            </div>

            {/* Visits list */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {visits.map((visit) => (
                <label
                  key={visit.id}
                  className="import-visits-checkbox"
                  style={{
                    backgroundColor: selectedVisits.includes(visit.id) ? 'var(--color-primary-lighter)' : 'var(--color-surface)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedVisits.includes(visit.id)}
                    onChange={() => toggleVisitSelection(visit.id)}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '14px', fontWeight: 500 }}>{visit.serviceName}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(visit.amount)}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      {formatDate(visit.date)} • {visit.hours} hrs @ {formatCurrency(visit.rate)}/hr
                      {visit.staffName && ` • ${visit.staffName}`}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {/* Summary */}
            {selectedVisits.length > 0 && (
              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                    {selectedVisits.length} visits • {totalSelectedHours.toFixed(2)} hrs
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 700 }}>{formatCurrency(totalSelectedAmount)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleImport}
                disabled={selectedVisits.length === 0}
                className="btn btn-primary btn-md"
                style={{ flex: 1, opacity: selectedVisits.length === 0 ? 0.5 : 1 }}
              >
                Import {selectedVisits.length > 0 ? `(${selectedVisits.length})` : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
