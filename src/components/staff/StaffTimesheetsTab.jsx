'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ExternalLink } from 'lucide-react';

export default function StaffTimesheetsTab({ staffId }) {
  const router = useRouter();
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/staff/${staffId}/timesheets`);
      if (response.ok) {
        const data = await response.json();
        setTimesheets(data);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  const getStatusBadge = (status) => {
    const variants = {
      DRAFT: 'gray',
      SUBMITTED: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      PAID: 'cyan',
    };
    const labels = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      PAID: 'Paid',
    };
    return (
      <span className={`badge badge-${variants[status] || 'gray'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Timesheets</h3>
      </div>
      <div className="card-body" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : timesheets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
            <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>Timesheets will appear here after payroll periods are generated or this staff member submits hours.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Week Of</th>
                <th>End Date</th>
                <th>Total Hours</th>
                <th>Overtime</th>
                <th>Approved By</th>
                <th>Status</th>
                <th style={{ width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {timesheets.map(timesheet => (
                <tr key={timesheet.id}>
                  <td style={{ fontSize: '13px', fontWeight: 500 }}>
                    {new Date(timesheet.startDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {new Date(timesheet.endDate).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: '13px', fontWeight: 500 }}>
                    {timesheet.totalHours} hrs
                  </td>
                  <td style={{ fontSize: '13px', color: timesheet.overtime > 0 ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                    {timesheet.overtime > 0 ? `${timesheet.overtime} hrs` : '-'}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    {timesheet.approvedBy || '-'}
                  </td>
                  <td>{getStatusBadge(timesheet.status)}</td>
                  <td>
                    <button
                      onClick={() => router.push(`/payroll/timesheets/${timesheet.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <ExternalLink size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
