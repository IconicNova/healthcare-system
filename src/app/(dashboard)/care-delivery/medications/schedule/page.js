'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Pill, CheckCircle, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', time: '6:00 AM - 12:00 PM', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', time: '12:00 PM - 5:00 PM', icon: '☀️' },
  { key: 'evening', label: 'Evening', time: '5:00 PM - 9:00 PM', icon: '🌆' },
  { key: 'night', label: 'Night', time: '9:00 PM - 6:00 AM', icon: '🌙' },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MedicationSchedulePage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('daily'); // daily | weekly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

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

  const getWeekDates = () => {
    const date = new Date(selectedDate);
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const groupMedicationsByTimeSlot = () => {
    const groups = {
      morning: [],
      afternoon: [],
      evening: [],
      night: [],
    };

    medications.forEach(med => {
      const freq = (med.frequency || '').toLowerCase();
      if (freq.includes('morning') || freq.includes('am') || freq.includes('breakfast')) {
        groups.morning.push(med);
      } else if (freq.includes('afternoon') || freq.includes('lunch')) {
        groups.afternoon.push(med);
      } else if (freq.includes('evening') || freq.includes('dinner') || freq.includes('pm')) {
        groups.evening.push(med);
      } else if (freq.includes('night') || freq.includes('bedtime') || freq.includes('hs')) {
        groups.night.push(med);
      } else {
        // Default: distribute to morning
        groups.morning.push(med);
      }

      // BID = twice daily -> morning + evening
      if (freq.includes('bid') || freq.includes('twice')) {
        groups.evening.push(med);
      }
      // TID = three times daily
      if (freq.includes('tid') || freq.includes('three')) {
        groups.afternoon.push(med);
        groups.evening.push(med);
      }
    });

    return groups;
  };

  const grouped = groupMedicationsByTimeSlot();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => router.push('/care-delivery/medications')}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              borderRadius: '8px',
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
              Medication Schedule
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              Visual timeline of medication administration
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('daily')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: viewMode === 'daily' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              backgroundColor: viewMode === 'daily' ? 'var(--color-primary)' : 'white',
              color: viewMode === 'daily' ? 'white' : 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Daily View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: viewMode === 'weekly' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
              backgroundColor: viewMode === 'weekly' ? 'var(--color-primary)' : 'white',
              color: viewMode === 'weekly' ? 'white' : 'var(--color-text)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Weekly View
          </button>
        </div>
      </div>

      {/* Client Selector + Date */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <select
          value={selectedClient?.id || ''}
          onChange={(e) => {
            const client = clients.find(c => c.id === e.target.value);
            setSelectedClient(client || null);
          }}
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
          }}
        >
          <option value="">Select a client...</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
          }}
        />
      </div>

      {!selectedClient ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: '16px',
        }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--color-text-secondary)' }} />
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            Select a client to view their medication schedule
          </p>
        </div>
      ) : medications.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 24px',
          backgroundColor: 'var(--color-gray-50)',
          borderRadius: '16px',
        }}>
          <Pill size={48} style={{ opacity: 0.3, marginBottom: '16px', color: 'var(--color-text-secondary)' }} />
          <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
            No medications found for this client
          </p>
        </div>
      ) : viewMode === 'daily' ? (
        /* Daily View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {TIME_SLOTS.map(slot => {
            const meds = grouped[slot.key] || [];
            return (
              <div
                key={slot.key}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--color-gray-50)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{slot.icon}</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>{slot.label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{slot.time}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    backgroundColor: meds.length > 0 ? '#DBEAFE' : 'var(--color-gray-100)',
                    color: meds.length > 0 ? '#1D4ED8' : 'var(--color-text-muted)',
                  }}>
                    {meds.length} medication{meds.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {meds.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                    No medications scheduled
                  </div>
                ) : (
                  <div style={{ padding: '8px' }}>
                    {meds.map((med, idx) => (
                      <div
                        key={`${med.id}-${idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'white',
                          marginBottom: idx < meds.length - 1 ? '4px' : 0,
                          transition: 'background-color 0.15s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Pill size={16} color="#3B82F6" />
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                              {med.name}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              {med.dosage} {med.unit} • {med.route || 'Oral'}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {med.frequency}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Weekly View */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', backgroundColor: 'var(--color-gray-50)', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', minWidth: '180px' }}>
                  Medication
                </th>
                {getWeekDates().map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <th
                      key={i}
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        borderBottom: '2px solid var(--color-border)',
                        backgroundColor: isToday ? '#EFF6FF' : 'var(--color-gray-50)',
                        fontWeight: isToday ? 700 : 600,
                        fontSize: '12px',
                        color: isToday ? '#1D4ED8' : 'var(--color-text-secondary)',
                        minWidth: '80px',
                      }}
                    >
                      <div>{DAYS_OF_WEEK[date.getDay()]}</div>
                      <div style={{ fontSize: '14px', fontWeight: isToday ? 700 : 500, color: isToday ? '#1D4ED8' : 'var(--color-text)' }}>
                        {date.getDate()}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {medications.map(med => (
                <tr key={med.id}>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 500 }}>{med.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                      {med.dosage} {med.unit} • {med.frequency}
                    </div>
                  </td>
                  {getWeekDates().map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <td
                        key={i}
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          borderBottom: '1px solid var(--color-border)',
                          backgroundColor: isToday ? '#EFF6FF' : 'transparent',
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#D1FAE5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto',
                        }}>
                          <CheckCircle size={14} color="#059669" />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
