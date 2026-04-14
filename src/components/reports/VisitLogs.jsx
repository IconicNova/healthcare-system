'use client';

import { useCallback, useEffect, useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { exportToCSV } from './ExportButton';

export default function VisitLogs() {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState({
    dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    clientId: '',
    staffId: '',
    serviceId: '',
    branchId: '',
    status: '',
  });
  const [data, setData] = useState(null);
  const [filterOptions, setFilterOptions] = useState({
    clients: [],
    staff: [],
    services: [],
    branches: [],
  });

  const fetchVisitLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...filters,
      });

      const response = await fetch(`/api/reports/visit-logs?${params}`);
      if (response.ok) {
        const jsonData = await response.json();
        setData(jsonData);
        setFilterOptions(jsonData.filters);
      }
    } catch (error) {
      console.error('Error fetching visit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, pageSize]);

  useEffect(() => {
    fetchVisitLogs();
  }, [fetchVisitLogs]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (!data || !data.visits) return;

    const csvData = data.visits.map(row => ({
      'Visit ID': row.id,
      Date: row.date,
      Client: row.client,
      Staff: row.staff,
      Service: row.service,
      'Scheduled': `${row.scheduled.start} - ${row.scheduled.end}`,
      'Actual': row.actual ? `${row.actual.start} - ${row.actual.end}` : 'N/A',
      Duration: row.duration,
      Status: row.status,
      EVV: row.evvVerified ? 'Verified' : 'Not Verified',
      Branch: row.branch,
    }));

    exportToCSV(csvData, `visit-logs-${format(new Date(), 'yyyy-MM-dd')}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      COMPLETED: '#10b981',
      SCHEDULED: '#3b82f6',
      MISSED: '#ef4444',
      CANCELLED: '#6b7280',
      IN_PROGRESS: '#f59e0b',
      CLOCKED_IN: '#06b6d4',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div>
      {/* Filters */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label className="form-label">From Date</label>
              <input
                type="date"
                className="input"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">To Date</label>
              <input
                type="date"
                className="input"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Client</label>
              <select
                className="select"
                value={filters.clientId}
                onChange={(e) => handleFilterChange('clientId', e.target.value)}
              >
                <option value="">All Clients</option>
                {filterOptions.clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Staff</label>
              <select
                className="select"
                value={filters.staffId}
                onChange={(e) => handleFilterChange('staffId', e.target.value)}
              >
                <option value="">All Staff</option>
                {filterOptions.staff.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Service</label>
              <select
                className="select"
                value={filters.serviceId}
                onChange={(e) => handleFilterChange('serviceId', e.target.value)}
              >
                <option value="">All Services</option>
                {filterOptions.services.map(service => (
                  <option key={service.id} value={service.id}>{service.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Branch</label>
              <select
                className="select"
                value={filters.branchId}
                onChange={(e) => handleFilterChange('branchId', e.target.value)}
              >
                <option value="">All Branches</option>
                {filterOptions.branches.map(branch => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select
                className="select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="CLOCKED_IN">Clocked In</option>
                <option value="COMPLETED">Completed</option>
                <option value="MISSED">Missed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button className="btn btn-secondary" onClick={handleExportCSV}>
          Export CSV
        </button>
        <button className="btn btn-secondary" onClick={handlePrint}>
          Print
        </button>
      </div>

      {/* Visit Logs Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Visit Logs</h3>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Staff</th>
                <th>Service</th>
                <th>Scheduled</th>
                <th>Actual</th>
                <th>Duration</th>
                <th>Status</th>
                <th>EVV</th>
                <th>Branch</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner" style={{ margin: '0 auto' }} />
                  </td>
                </tr>
              ) : data?.visits?.length > 0 ? (
                data.visits.map((visit, index) => (
                  <tr key={index}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{visit.id}</td>
                    <td>{visit.date}</td>
                    <td>{visit.client}</td>
                    <td>{visit.staff}</td>
                    <td>{visit.service}</td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {visit.scheduled.start} - {visit.scheduled.end}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px' }}>
                        {visit.actual ? `${visit.actual.start} - ${visit.actual.end}` : '-'}
                      </div>
                    </td>
                    <td>{visit.duration}</td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: getStatusBadgeColor(visit.status) + '20',
                          color: getStatusBadgeColor(visit.status),
                        }}
                      >
                        {visit.status}
                      </span>
                    </td>
                    <td>
                      {visit.evvVerified ? (
                        <span style={{ color: '#10b981' }}>✅ Verified</span>
                      ) : (
                        <span style={{ color: '#f59e0b' }}>⚠️ Not Verified</span>
                      )}
                    </td>
                    <td>{visit.branch}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    No visit logs found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pagination.totalPages > 1 && (
          <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="pagination-info">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.totalCount} total)
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              <button
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(data.pagination.totalPages, prev + 1))}
                disabled={currentPage === data.pagination.totalPages}
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
