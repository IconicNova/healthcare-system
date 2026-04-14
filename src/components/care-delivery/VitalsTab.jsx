'use client';

import { useState, useEffect } from 'react';
import { Plus, Thermometer, Heart, Activity, Droplet, TrendingUp, Calendar } from 'lucide-react';
import VitalsEntryForm from './VitalsEntryForm';
import VitalsChart from './VitalsChart';

const VITAL_TYPES = [
  { key: 'temperature', label: 'Temperature', icon: Thermometer, unit: 'F', abnormal: { low: 95, high: 99.5 } },
  { key: 'heartRate', label: 'Heart Rate', icon: Heart, unit: 'bpm', abnormal: { low: 60, high: 100 } },
  { key: 'bloodPressureSystolic', label: 'BP Systolic', icon: Activity, unit: 'mmHg', abnormal: { low: 90, high: 140 } },
  { key: 'bloodPressureDiastolic', label: 'BP Diastolic', icon: Activity, unit: 'mmHg', abnormal: { low: 60, high: 90 } },
  { key: 'respiratoryRate', label: 'Resp. Rate', icon: Droplet, unit: 'rpm', abnormal: { low: 12, high: 20 } },
  { key: 'oxygenSaturation', label: 'O2 Saturation', icon: Droplet, unit: '%', abnormal: { low: 95, high: 100 } },
  { key: 'painLevel', label: 'Pain Level', icon: Activity, unit: '/10', abnormal: { low: 0, high: 3 } },
  { key: 'weight', label: 'Weight', icon: TrendingUp, unit: 'lbs', abnormal: null },
  { key: 'glucose', label: 'Glucose', icon: Droplet, unit: 'mg/dL', abnormal: { low: 70, high: 140 } },
];

export default function VitalsTab({ clientId }) {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [chartVitalType, setChartVitalType] = useState('heartRate');
  const [timeRange, setTimeRange] = useState(30); // days

  useEffect(() => {
    if (!clientId) return;

    const fetchVitals = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/vitals?limit=50`);
        if (response.ok) {
          const data = await response.json();
          setVitals(data.vitals || []);
        }
      } catch (error) {
        console.error('Error fetching vitals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVitals();
  }, [clientId]);

  const getLatestVital = (key) => {
    const sorted = [...vitals].sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt));
    return sorted.find(v => v[key] !== null && v[key] !== undefined);
  };

  const isAbnormal = (key, value) => {
    const vitalConfig = VITAL_TYPES.find(v => v.key === key);
    if (!vitalConfig?.abnormal) return null;
    if (value < vitalConfig.abnormal.low) return 'low';
    if (value > vitalConfig.abnormal.high) return 'high';
    return null;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    };
  };

  if (!clientId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a client to view vitals</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Vitals Tracking</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Monitor vital signs and track trends over time
          </p>
        </div>
        <button
          onClick={() => setShowEntryForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Record Vitals
        </button>
      </div>

      {/* Latest Vitals Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {VITAL_TYPES.map(({ key, label, icon: Icon, unit }) => {
          const latest = getLatestVital(key);
          const status = latest ? isAbnormal(key, latest[key]) : null;

          return (
            <div
              key={key}
              style={{
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
                ...(status === 'high' ? { borderLeft: '4px solid #EF4444' } : {}),
                ...(status === 'low' ? { borderLeft: '4px solid #F59E0B' } : {}),
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Icon size={16} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)' }}>
                {latest ? latest[key] : '-'}
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>
                  {latest ? ` ${unit}` : ''}
                </span>
              </div>
              {latest && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  {formatDateTime(latest.recordedAt).date} {formatDateTime(latest.recordedAt).time}
                </div>
              )}
              {status === 'high' && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', color: '#EF4444', fontWeight: 500 }}>
                  HIGH
                </span>
              )}
              {status === 'low' && (
                <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px', color: '#F59E0B', fontWeight: 500 }}>
                  LOW
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend Chart */}
      <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Trend Analysis</h5>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={chartVitalType}
              onChange={(e) => setChartVitalType(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
              }}
            >
              {VITAL_TYPES.filter(v => v.abnormal).map(v => (
                <option key={v.key} value={v.key}>{v.label}</option>
              ))}
            </select>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '12px',
              }}
            >
              <option value={7}>7 Days</option>
              <option value={30}>30 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
        </div>
        <VitalsChart clientId={clientId} vitalType={chartVitalType} days={timeRange} />
      </div>

      {/* Vitals History Table */}
      <div style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <h5 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Vitals History</h5>
        </div>
        {vitals.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            <p style={{ fontSize: '14px' }}>No vitals recorded yet</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: 'var(--color-gray-50)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Date/Time</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Temperature</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Blood Pressure</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Heart Rate</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>O2 Sat</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Pain</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Glucose</th>
                </tr>
              </thead>
              <tbody>
                {vitals.map((vital) => (
                  <tr key={vital.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                        {formatDateTime(vital.recordedAt).date} {formatDateTime(vital.recordedAt).time}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.temperature ? `${vital.temperature}${vital.temperatureUnit || 'F'}` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                        ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                        : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.heartRate ? `${vital.heartRate} bpm` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.painLevel !== null && vital.painLevel !== undefined ? vital.painLevel : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--color-text)' }}>
                      {vital.glucose ? `${vital.glucose} mg/dL` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <VitalsEntryForm
          clientId={clientId}
          onClose={() => setShowEntryForm(false)}
          onSuccess={() => {
            setShowEntryForm(false);
            const fetchVitals = async () => {
              const response = await fetch(`/api/clients/${clientId}/vitals?limit=50`);
              if (response.ok) {
                const data = await response.json();
                setVitals(data.vitals || []);
              }
            };
            fetchVitals();
          }}
        />
      )}
    </div>
  );
}
