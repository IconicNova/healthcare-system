'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import MeasuredChartFrame from './MeasuredChartFrame';

export default function RevenueChart() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        const response = await fetch('/api/dashboard/revenue-chart');
        if (response.ok) {
          const result = await response.json();
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching revenue chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenueData();
  }, []);

  if (loading) {
    return (
      <div className="card dashboard-chart-card">
        <div className="card-body">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Monthly Revenue
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
          Monthly Revenue
        </h3>
        <MeasuredChartFrame className="dashboard-chart-frame" height={250}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
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
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                formatter={(value) => `$${value.toFixed(2)}`}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend iconType="circle" />
              <Bar dataKey="paid" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </MeasuredChartFrame>
      </div>
    </div>
  );
}
