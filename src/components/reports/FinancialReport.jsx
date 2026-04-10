'use client';

import { useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV } from './ExportButton';

// Chart components are defined below (RevenueChartWithData, AgingChartWithData)
// They use dynamic require('recharts') to avoid SSR issues

export default function FinancialReport() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchFinancialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/reports/financial?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;

    // Export service breakdown
    const csvData = data.serviceBreakdown.map(row => ({
      Service: row.service,
      Visits: row.visits,
      Hours: row.hours,
      Revenue: `$${row.revenue.toFixed(2)}`,
      'Percentage of Total': `${row.percentage}%`,
    }));

    exportToCSV(csvData, `financial-report-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handlePrint = () => {
    window.print();
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
        <div style={{ flex: 1 }} />
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          Export CSV
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>
          Print Report
        </button>
      </div>

      {/* Revenue Summary Cards */}
      {data && (
        <div className="report-summary-cards">
          <div className="report-summary-card">
            <div className="report-summary-value">${data.summary.totalRevenue.toFixed(2)}</div>
            <div className="report-summary-label">Total Revenue</div>
          </div>
          <div className="report-summary-card">
            <div className="report-summary-value">${data.summary.totalExpenses.toFixed(2)}</div>
            <div className="report-summary-label">Total Expenses</div>
          </div>
          <div className="report-summary-card">
            <div className="report-summary-value">${data.summary.netProfit.toFixed(2)}</div>
            <div className="report-summary-label">Net Profit</div>
          </div>
        </div>
      )}

      {/* Revenue Chart */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Revenue Overview</h3>
        </div>
        <div className="card-body">
          <RevenueChartWithData data={data?.revenueData} />
        </div>
      </div>

      {/* Service Breakdown Table */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Revenue by Service</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Visits</th>
                <th>Hours</th>
                <th>Revenue</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {data?.serviceBreakdown?.length > 0 ? (
                data.serviceBreakdown.map((row, index) => (
                  <tr key={index}>
                    <td>{row.service}</td>
                    <td>{row.visits}</td>
                    <td>{row.hours}</td>
                    <td>${row.revenue.toFixed(2)}</td>
                    <td>{row.percentage}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    No service data available for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Aging Report */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoice Aging Report</h3>
        </div>
        <div className="card-body">
          <AgingChartWithData data={data?.agingData} />
          <div className="table-container" style={{ marginTop: '24px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Aging Bucket</th>
                  <th>Count</th>
                  <th>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {data?.agingData?.map((row, index) => (
                  <tr key={index}>
                    <td>{row.bucket}</td>
                    <td>{row.count}</td>
                    <td>${row.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Separate component for charts to handle dynamic import
function RevenueChartWithData({ data }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded || !data || data.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No revenue data available</div>;
  }

  const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } =
    require('recharts'); // eslint-disable-line @typescript-eslint/no-require-imports

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#1e3a5f"
          fillOpacity={1}
          fill="url(#colorRevenue)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function AgingChartWithData({ data }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded || !data || data.length === 0) {
    return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No aging data available</div>;
  }

  const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } =
    require('recharts'); // eslint-disable-line @typescript-eslint/no-require-imports

  // maxTotal available for future use
  // const maxTotal = Math.max(...data.map(d => d.total));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="bucket" stroke="#64748b" fontSize={12} angle={-15} textAnchor="end" height={60} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `$${value}`} />
        <Tooltip
          formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']}
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
        />
        <Bar
          dataKey="total"
          fill="#1e3a5f"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
