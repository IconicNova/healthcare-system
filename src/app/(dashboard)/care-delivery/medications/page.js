'use client';

import { useState, useEffect } from 'react';
import { Pill, Plus, History } from 'lucide-react';
import Modal from '@/components/ui/Modal';

const STATUS_CONFIG = {
  ADMINISTERED: { label: 'Administered', color: '#16A34A', bg: '#16A34A15' },
  HELD: { label: 'Held', color: '#F59E0B', bg: '#F59E0B15' },
  REFUSED: { label: 'Refused', color: '#EF4444', bg: '#EF444415' },
  NOT_GIVEN: { label: 'Not Given', color: '#6B7280', bg: '#6B728015' },
};

export default function MedicationsPage() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [showMedicationDetail, setShowMedicationDetail] = useState(false);
  const [showAdministerModal, setShowAdministerModal] = useState(false);
  const [administrationData, setAdministrationData] = useState({
    status: 'ADMINISTERED',
    dosage: '',
    unit: '',
    reason: '',
    comment: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients?limit=100');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClient) return;

    const fetchMedications = async () => {
      try {
        const response = await fetch(`/api/clients/${selectedClient.id}/medications`);
        if (response.ok) {
          const data = await response.json();
          setMedications(data.medications || []);
        }
      } catch (error) {
        console.error('Error fetching medications:', error);
      }
    };

    fetchMedications();
  }, [selectedClient]);

  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    const client = clients.find(c => c.id === clientId);
    setSelectedClient(client);
    setMedications([]);
    setSelectedMedication(null);
  };

  const handleMedicationSelect = async (medication) => {
    setSelectedMedication(medication);
    setShowMedicationDetail(true);

    // Fetch administration history
    try {
      const response = await fetch(`/api/medications/${medication.id}/history`);
      if (response.ok) {
        const data = await response.json();
        medication.history = data.history || [];
      }
    } catch (error) {
      console.error('Error fetching medication history:', error);
    }
  };

  const handleAdministerClick = () => {
    setAdministrationData({
      status: 'ADMINISTERED',
      dosage: selectedMedication?.dosage || '',
      unit: '',
      reason: '',
      comment: '',
    });
    setShowAdministerModal(true);
  };

  const handleAdministerSubmit = async () => {
    if (!selectedMedication) return;

    try {
      const response = await fetch(`/api/medications/${selectedMedication.id}/administer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(administrationData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('Medication administration recorded successfully');

        // Refresh medication data
        const updatedMedication = { ...selectedMedication };
        if (updatedMedication.history) {
          updatedMedication.history.unshift(result.administration);
        }
        setSelectedMedication(updatedMedication);

        setShowAdministerModal(false);
      } else {
        alert('Failed to record medication administration');
      }
    } catch (error) {
      console.error('Error administering medication:', error);
      alert('Failed to record medication administration');
    }
  };

  const formatDateTime = (date) => {
    const d = new Date(date);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Medications
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          View and administer medications for clients
        </p>
      </div>

      {/* Client Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
          Select Client
        </label>
        <select
          value={selectedClient?.id || ''}
          onChange={handleClientSelect}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="">-- Select a client --</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.firstName} {client.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Medications Table */}
      {selectedClient ? (
        medications.length === 0 ? (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Pill size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              No medications found for {selectedClient.firstName} {selectedClient.lastName}
            </p>
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Medication Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Route</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {medications.map(med => (
                    <tr key={med.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{med.name}</div>
                        {med.notes && (
                          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {med.notes.substring(0, 30)}{med.notes.length > 30 ? '...' : ''}
                          </div>
                        )}
                      </td>
                      <td>{med.dosage}</td>
                      <td>{med.frequency}</td>
                      <td>{med.route || '-'}</td>
                      <td>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: med.status === 'Active' ? 'var(--color-success-light)' : 'var(--color-gray-100)',
                          color: med.status === 'Active' ? '#065f46' : 'var(--color-text-secondary)',
                        }}>
                          {med.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleMedicationSelect(med)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: 'var(--color-primary)',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                          }}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <Pill size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
            Select a client to view their medications
          </p>
        </div>
      )}

      {/* Medication Detail Modal */}
      {selectedMedication && (
        <Modal
          isOpen={showMedicationDetail}
          onClose={() => setShowMedicationDetail(false)}
          title={`${selectedMedication.name} - Details`}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Medication Info */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Medication Information</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Name</span>
                <span style={{ fontSize: '13px' }}>{selectedMedication.name}</span>

                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Dosage</span>
                <span style={{ fontSize: '13px' }}>{selectedMedication.dosage}</span>

                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Frequency</span>
                <span style={{ fontSize: '13px' }}>{selectedMedication.frequency}</span>

                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Route</span>
                <span style={{ fontSize: '13px' }}>{selectedMedication.route || 'Not specified'}</span>

                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Client</span>
                <span style={{ fontSize: '13px' }}>{selectedClient?.firstName} {selectedClient?.lastName}</span>

                {selectedMedication.notes && (
                  <>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>Notes</span>
                    <span style={{ fontSize: '13px' }}>{selectedMedication.notes}</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleAdministerClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={18} />
              Administer Medication
            </button>

            {/* Administration History */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={16} />
                Administration History
              </h4>
              {selectedMedication.history && selectedMedication.history.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedMedication.history.slice(0, 10).map(admin => {
                    const status = STATUS_CONFIG[admin.status] || STATUS_CONFIG.ADMINISTERED;
                    return (
                      <div key={admin.id} style={{
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--color-gray-50)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: '12px',
                            backgroundColor: status.bg,
                            color: status.color,
                          }}>
                            {status.label}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            {formatDateTime(admin.administeredAt).date} at {formatDateTime(admin.administeredAt).time}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>
                          {admin.dosage && admin.unit && (
                            <div>Dosage: {admin.dosage} {admin.unit}</div>
                          )}
                          {admin.comment && (
                            <div style={{ marginTop: '4px' }}>{admin.comment}</div>
                          )}
                          {admin.reason && (
                            <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                              Reason: {admin.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-secondary)' }}>
                  <p style={{ fontSize: '13px' }}>No administration history yet</p>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Administer Medication Modal */}
      <Modal
        isOpen={showAdministerModal}
        onClose={() => setShowAdministerModal(false)}
        title={`Administer ${selectedMedication?.name}`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Selection */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
              Status *
            </label>
            <select
              value={administrationData.status}
              onChange={(e) => setAdministrationData(prev => ({ ...prev, status: e.target.value }))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                backgroundColor: 'white',
              }}
            >
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Dosage */}
          {administrationData.status === 'ADMINISTERED' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                Dosage Administered
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={administrationData.dosage}
                  onChange={(e) => setAdministrationData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 1"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                />
                <input
                  type="text"
                  value={administrationData.unit}
                  onChange={(e) => setAdministrationData(prev => ({ ...prev, unit: e.target.value }))}
                  placeholder="Unit (mg, mL, etc.)"
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Reason for non-administration */}
          {administrationData.status !== 'ADMINISTERED' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
                Reason
              </label>
              <textarea
                value={administrationData.reason}
                onChange={(e) => setAdministrationData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Why was the medication not administered?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  fontSize: '13px',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {/* Additional Comments */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>
              Comments (optional)
            </label>
            <textarea
              value={administrationData.comment}
              onChange={(e) => setAdministrationData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Any additional notes..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              onClick={() => setShowAdministerModal(false)}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'white',
                color: 'var(--color-text)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdministerSubmit}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Record Administration
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
