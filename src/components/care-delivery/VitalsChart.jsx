'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertCircle } from 'lucide-react';

export default function VitalsChart({ clientId, vitalType, days = 30 }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const vitalConfig = {
    temperature: { label: 'Temperature', unit: 'F', min: 95, max: 102, normalMin: 97, normalMax: 99 },
    heartRate: { label: 'Heart Rate', unit: 'bpm', min: 40, max: 200, normalMin: 60, normalMax: 100 },
    bloodPressureSystolic: { label: 'BP Systolic', unit: 'mmHg', min: 70, max: 200, normalMin: 90, normalMax: 140 },
    bloodPressureDiastolic: { label: 'BP Diastolic', unit: 'mmHg', min: 40, max: 130, normalMin: 60, normalMax: 90 },
    respiratoryRate: { label: 'Resp. Rate', unit: 'rpm', min: 6, max: 40, normalMin: 12, normalMax: 20 },
    oxygenSaturation: { label: 'O2 Saturation', unit: '%', min: 80, max: 100, normalMin: 95, normalMax: 100 },
    painLevel: { label: 'Pain Level', unit: '/10', min: 0, max: 10, normalMin: 0, normalMax: 3 },
    glucose: { label: 'Glucose', unit: 'mg/dL', min: 40, max: 400, normalMin: 70, normalMax: 140 },
    weight: { label: 'Weight', unit: 'lbs', min: 0, max: 500, normalMin: 0, normalMax: 500 },
  };

  const config = vitalConfig[vitalType] || vitalConfig.heartRate;

  useEffect(() => {
    if (!clientId) return;

    const fetchTrendData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(
          `/api/vitals/${clientId}/trends?type=${vitalType}&days=${days}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            // Format data for chart
            const formatted = data.data.map(point => ({
              date: new Date(point.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              }),
              value: point.value,
              originalDate: point.date,
            }));
            // Sort by date
            formatted.sort((a, b) => new Date(a.originalDate) - new Date(b.originalDate));
            setChartData(formatted);
          }
        } else {
          setError('Failed to fetch trend data');
        }
      } catch (error) {
        console.error('Error fetching trend data:', error);
        setError('Failed to fetch trend data');
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [clientId, vitalType, days]);

  if (!clientId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a client to view vitals chart</p>
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

  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px' }}>{error}</span>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>No data available for the selected time period</p>
      </div>
    );
  }

  return (
    <div style={{ height: '300px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
          />
          <YAxis
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            domain={[config.normalMin - 10, config.normalMax + 10]}
            label={{
              value: config.unit,
              angle: -90,
              position: 'insideLeft',
              fill: '#6B7280',
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value) => [`${value} ${config.unit}`, config.label]}
            labelStyle={{ color: '#1F2937' }}
          />
          {/* Normal range reference lines */}
          <ReferenceLine
            y={config.normalMin}
            stroke="#10B981"
            strokeDasharray="5 5"
            label={{
              value: 'Normal Min',
              position: 'insideStartLeft',
              fill: '#10B981',
              fontSize: 10,
            }}
          />
          <ReferenceLine
            y={config.normalMax}
            stroke="#10B981"
            strokeDasharray="5 5"
            label={{
              value: 'Normal Max',
              position: 'insideEndLeft',
              fill: '#10B981',
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ fill: 'var(--color-primary)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div style={{
        marginTop: '8px',
        fontSize: '11px',
        color: 'var(--color-text-muted)',
        textAlign: 'center',
      }}>
        Showing {config.label} trend over the past {days} days. Green dashed lines indicate normal range.
      </div>
    </div>
  );
}
