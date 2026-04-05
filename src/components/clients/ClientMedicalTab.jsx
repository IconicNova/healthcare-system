'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, X, Pill, Activity } from 'lucide-react';

export default function ClientMedicalTab({ client }) {
  const [saving, setSaving] = useState(false);
  const [showMedForm, setShowMedForm] = useState(false);
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [medForm, setMedForm] = useState({ name: '', dosage: '', frequency: '', notes: '' });
  const [historyForm, setHistoryForm] = useState({ condition: '', diagnosis: '', date: '', notes: '' });

  const handleSaveMedical = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/clients/${client.id}/medical`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medications: client.medications?.map(m => m) || [],
          medicalHistory: client.medicalHistory?.map(h => h) || [],
        }),
      });
      if (response.ok) {
        // Update local state
        const data = await response.json();
        // client.medications = data.medications;
        // client.medicalHistory = data.medicalHistory;
      }
    } catch (error) {
      console.error('Error saving medical info:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMedication = () => {
    if (!medForm.name.trim()) return;
    // In a full implementation, this would add to the medications array
    setShowMedForm(false);
    setMedForm({ name: '', dosage: '', frequency: '', notes: '' });
  };

  const handleAddHistory = () => {
    if (!historyForm.condition.trim()) return;
    // In a full implementation, this would add to the medical history array
    setShowHistoryForm(false);
    setHistoryForm({ condition: '', diagnosis: '', date: '', notes: '' });
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Medications */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Medications
              </h3>
              <Button variant="secondary" size="small" onClick={() => setShowMedForm(!showMedForm)}>
                <Plus size={14} />
                Add
              </Button>
            </div>

            {showMedForm && (
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                <Input
                  label="Medication Name"
                  value={medForm.name}
                  onChange={(e) => setMedForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input
                    label="Dosage"
                    value={medForm.dosage}
                    onChange={(e) => setMedForm(prev => ({ ...prev, dosage: e.target.value }))}
                  />
                  <Input
                    label="Frequency"
                    value={medForm.frequency}
                    onChange={(e) => setMedForm(prev => ({ ...prev, frequency: e.target.value }))}
                  />
                </div>
                <Input
                  label="Notes"
                  value={medForm.notes}
                  onChange={(e) => setMedForm(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button size="small" onClick={handleAddMedication} disabled={saving}>
                    Save
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => setShowMedForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {client.medications?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {client.medications.map((med) => (
                  <div
                    key={med.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #fde68a',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div style={{ color: '#d97706', marginTop: '2px' }}>
                      <Pill size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{med.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {med.dosage} • {med.frequency}
                      </div>
                      {med.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                          {med.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Pill size={32} color="var(--color-border)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No medications recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical History */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                Medical History
              </h3>
              <Button variant="secondary" size="small" onClick={() => setShowHistoryForm(!showHistoryForm)}>
                <Plus size={14} />
                Add
              </Button>
            </div>

            {showHistoryForm && (
              <div style={{ marginBottom: '16px', padding: '16px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px' }}>
                <Input
                  label="Condition"
                  value={historyForm.condition}
                  onChange={(e) => setHistoryForm(prev => ({ ...prev, condition: e.target.value }))}
                  style={{ marginBottom: '12px' }}
                />
                <Input
                  label="Diagnosis"
                  value={historyForm.diagnosis}
                  onChange={(e) => setHistoryForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  style={{ marginBottom: '12px' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <Input
                    label="Date Diagnosed"
                    type="date"
                    value={historyForm.date}
                    onChange={(e) => setHistoryForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <Input
                  label="Notes"
                  value={historyForm.notes}
                  onChange={(e) => setHistoryForm(prev => ({ ...prev, notes: e.target.value }))}
                  multiline
                />
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <Button size="small" onClick={handleAddHistory} disabled={saving}>
                    Save
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => setShowHistoryForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {client.medicalHistory?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {client.medicalHistory.map((history) => (
                  <div
                    key={history.id}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <div style={{ color: '#dc2626', marginTop: '2px' }}>
                      <Activity size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{history.condition}</div>
                      {history.diagnosis && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Diagnosis: {history.diagnosis}
                        </div>
                      )}
                      {history.date && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          Date: {format(new Date(history.date), 'MMM d, yyyy')}
                        </div>
                      )}
                      {history.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                          {history.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <Activity size={32} color="var(--color-border)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No medical history recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
