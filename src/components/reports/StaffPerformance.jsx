'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function StaffPerformance() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [data, setData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'completionRate', direction: 'desc' });

  useEffect(() => {
    fetchStaffPerformance();
  }, [dateFrom, dateTo]);

  const fetchStaffPerformance = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/staff-performance?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData.staffPerformance);
      }
    } catch (error) {
      console.error('Error fetching staff performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc'
      ? aValue - bValue
      : bValue - aValue;
  });

  const getCompletionRateColor = (rate) => {
    if (rate >= 90) return '#10b981'; // green
    if (rate >= 70) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const handleRowClick = (staffId) => {
    router.push(`/staff/${staffId}`);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ height: '200px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Date Range Picker */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>
          From:
        </label>
        <input
          type="date"
          className="input"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ width: '150px' }}
        />
        <label className="form-label" style={{ marginBottom: 0 }}>
          To:
        </label>
        <input
          type="date"
          className="input"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ width: '150px' }}
        />
      </div>

      {/* Performance Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Performance Comparison</h3>
        </div>
        <div className="card-body">
          <PerformanceChart data={sortedData} />
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Staff Performance Details</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Staff {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Total Visits</th>
                <th>Completed</th>
                <th>Missed</th>
                <th onClick={() => handleSort('completionRate')} className="sortable">
                  Completion Rate {sortConfig.key === 'completionRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                </th>
                <th>Avg Duration (hrs)</th>
                <th>Punctuality</th>
                <th>Forms Submitted</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.length > 0 ? (
                sortedData.map((staff) => (
                  <tr
                    key={staff.id}
                    onClick={() => handleRowClick(staff.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong>{staff.name}</strong>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{staff.role}</div>
                    </td>
                    <td>{staff.totalVisits}</td>
                    <td>{staff.completed}</td>
                    <td>{staff.missed}</td>
                    <td>
                      <span
                        style={{
                          color: getCompletionRateColor(staff.completionRate),
                          fontWeight: 'bold',
                        }}
                      >
                        {staff.completionRate}%
                      </span>
                    </td>
                    <td>{staff.avgDuration}</td>
                    <td>{staff.punctuality}%</td>
                    <td>{staff.formsSubmitted}</td>
                    <td>
                      <span style={{ color: '#f59e0b' }}>
                        {'★'.repeat(Math.floor(staff.rating))}
                        {'☆'.repeat(5 - Math.floor(staff.rating))}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>
                    No staff performance data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PerformanceChart({ data }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded || !data || data.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data available</div>;
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } =
    require('recharts'); // eslint-disable-line @typescript-eslint/no-require-imports

  const getBarColor = (rate) => {
    if (rate >= 90) return '#10b981';
    if (rate >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
        <YAxis
          type="category"
          dataKey="name"
          stroke="#64748b"
          fontSize={11}
          width={120}
        />
        <Tooltip
          formatter={(value) => [`${value}%`, 'Completion Rate']}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
        <Bar
          dataKey="completionRate"
          fill="#1e3a5f"
          radius={[0, 4, 4, 0]}
          shape={(props) => {
            const { x, y, width, height, payload } = props;
            return (
              <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={4}
                ry={4}
                fill={getBarColor(payload.completionRate)}
              />
            );
          }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
