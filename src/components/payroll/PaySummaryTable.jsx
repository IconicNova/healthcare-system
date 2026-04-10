'use client';

import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

export default function PaySummaryTable() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [paySummary, setPaySummary] = useState([]);
  const [totals, setTotals] = useState(null);
  const [period, setPeriod] = useState(null);

  // Default to current week
  const getDefaultPeriod = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return {
      startDate: startOfWeek.toISOString().split('T')[0],
      endDate: endOfWeek.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultPeriod());

  const fetchPaySummary = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/payroll/pay-summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPaySummary(data.paySummary);
        setTotals(data.totals);
        setPeriod(data.period);
      }
    } catch (error) {
      console.error('Error fetching pay summary:', error);
      toast('error', 'Error', 'Failed to load pay summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaySummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate]);

  const handleExport = () => {
    if (!paySummary.length) {
      toast('warning', 'No Data', 'No pay data to export');
      return;
    }

    const headers = ['Staff', 'Employee ID', 'Pay Type', 'Rate', 'Regular Hours', 'Overtime Hours', 'Regular Pay', 'Overtime Pay', 'Gross Pay'];
    const rows = paySummary.map((staff) => [
      `"${staff.staffName}"`,
      staff.employeeId,
      staff.payType,
      staff.payRate.toFixed(2),
      staff.regularHours.toFixed(2),
      staff.overtimeHours.toFixed(2),
      staff.regularPay.toFixed(2),
      staff.overtimePay.toFixed(2),
      staff.grossPay.toFixed(2),
    ]);

    if (totals) {
      rows.push([
        '"TOTALS"', '', '', '',
        totals.regularHours.toFixed(2),
        totals.overtimeHours.toFixed(2),
        totals.regularPay.toFixed(2),
        totals.overtimePay.toFixed(2),
        totals.grossPay.toFixed(2),
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pay-summary-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast('success', 'Downloaded', 'Pay summary CSV exported');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
        Loading pay summary...
      </div>
    );
  }

  return (
    <div>
      {/* Date Range Selector */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Period:</label>
        <input
          type="date"
          value={dateRange.startDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
          className="input"
          style={{ width: '160px' }}
        />
        <span style={{ color: 'var(--color-text-secondary)' }}>to</span>
        <input
          type="date"
          value={dateRange.endDate}
          onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
          className="input"
          style={{ width: '160px' }}
        />
        <Button onClick={handleExport} variant="secondary" icon={FileDown}>
          Export CSV
        </Button>
      </div>

      {/* Summary Header */}
      {period && (
        <div style={{ padding: '12px', backgroundColor: 'var(--color-background)', borderRadius: '8px', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Pay Summary for: {formatDate(new Date(period.startDate))} - {formatDate(new Date(period.endDate))}
          </p>
        </div>
      )}

      {/* Empty State */}
      {paySummary.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
          No approved timesheets found for this period.
        </div>
      )}

      {/* Pay Summary Table */}
      {paySummary.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="pay-summary-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Pay Type</th>
                <th>Rate</th>
                <th>Regular Hours</th>
                <th>Overtime Hours</th>
                <th>Regular Pay</th>
                <th>Overtime Pay</th>
                <th>Gross Pay</th>
              </tr>
            </thead>
            <tbody>
              {paySummary.map((staff) => (
                <tr key={staff.staffId}>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{staff.staffName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{staff.employeeId}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '12px', color: 'var(--color-text)' }}>{staff.payType}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                      {staff.payType === 'HOURLY' ? `$${staff.payRate.toFixed(2)}/hr` : `$${staff.payRate.toFixed(0)}/yr`}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{staff.regularHours.toFixed(2)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: staff.overtimeHours > 0 ? 'var(--color-warning)' : 'var(--color-text)' }}>
                      {staff.overtimeHours.toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatCurrency(staff.regularPay)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{formatCurrency(staff.overtimePay)}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-primary)' }}>{formatCurrency(staff.grossPay)}</div>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              {totals && (
                <tr className="totals-row">
                  <td colSpan="2">
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Totals</span>
                  </td>
                  <td>-</td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{totals.regularHours.toFixed(2)}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{totals.overtimeHours.toFixed(2)}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatCurrency(totals.regularPay)}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatCurrency(totals.overtimePay)}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(totals.grossPay)}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
