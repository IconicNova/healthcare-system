'use client';

import { useEffect, useState } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import MeasuredChartFrame from './MeasuredChartFrame';

export default function VisitChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchVisitData() {
      try {
        const response = await fetch('/api/dashboard/visit-chart');
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching visit chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitData();
  }, []);

  if (loading) {
    return (
      <div className="card dashboard-chart-card">
        <div className="card-body">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Weekly Visits
          </h3>
          <div style={{ height: '250px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card dashboard-chart-card">
      <div className="card-body">
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
          Weekly Visits
        </h3>
        <MeasuredChartFrame className="dashboard-chart-frame" height={250}>
          {({ width, height }) => (
            <AreaChart width={width} height={height} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend iconType="circle" />
              <Area
                type="monotone"
                dataKey="scheduled"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorScheduled)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                fillOpacity={1}
                fill="url(#colorCompleted)"
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </MeasuredChartFrame>
      </div>
    </div>
  );
}
