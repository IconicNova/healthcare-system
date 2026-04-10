'use client';

import { useState, useEffect } from 'react';
import { FileDown, FileSpreadsheet, Building2, Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

const EXPORT_FORMATS = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Standard comma-separated values. Compatible with Excel, Google Sheets.',
    icon: FileSpreadsheet,
    available: true,
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks IIF',
    description: 'Import file format for QuickBooks Desktop.',
    icon: Building2,
    available: false,
  },
  {
    id: 'xero',
    name: 'Xero CSV',
    description: 'Formatted CSV compatible with Xero payroll import.',
    icon: FileDown,
    available: false,
  },
];

export default function ExportAccountingModal({ isOpen, onClose }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [paySummaryData, setPaySummaryData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  const getDefaultPeriod = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultPeriod());

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoadingData(true);
      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        });
        const response = await fetch(`/api/payroll/pay-summary?${params}`);
        if (response.ok) {
          const data = await response.json();
          setPaySummaryData(data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [isOpen, dateRange.startDate, dateRange.endDate]);

  const generateCSV = () => {
    if (!paySummaryData?.paySummary?.length) {
      toast('warning', 'No Data', 'No payroll data available for this period');
      return;
    }

    const headers = [
      'Employee ID',
      'Staff Name',
      'Pay Type',
      'Pay Rate',
      'Regular Hours',
      'Overtime Hours',
      'Regular Pay',
      'Overtime Pay',
      'Mileage Pay',
      'Gross Pay',
      'Period',
    ];

    const rows = paySummaryData.paySummary.map((staff) => [
      staff.employeeId,
      `"${staff.staffName}"`,
      staff.payType,
      staff.payRate.toFixed(2),
      staff.regularHours.toFixed(2),
      staff.overtimeHours.toFixed(2),
      staff.regularPay.toFixed(2),
      staff.overtimePay.toFixed(2),
      staff.mileagePay.toFixed(2),
      staff.grossPay.toFixed(2),
      `"${staff.timesheetPeriod || `${dateRange.startDate} to ${dateRange.endDate}`}"`,
    ]);

    // Add totals row
    const totals = paySummaryData.totals;
    rows.push([
      '',
      '"TOTALS"',
      '',
      '',
      totals.regularHours.toFixed(2),
      totals.overtimeHours.toFixed(2),
      totals.regularPay.toFixed(2),
      totals.overtimePay.toFixed(2),
      totals.mileagePay.toFixed(2),
      totals.grossPay.toFixed(2),
      '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    // Create and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payroll-export-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast('success', 'Downloaded', 'Payroll CSV exported successfully');
  };

  const handleExport = () => {
    setLoading(true);

    if (selectedFormat === 'csv') {
      generateCSV();
    } else {
      toast('info', 'Coming Soon', `${EXPORT_FORMATS.find(f => f.id === selectedFormat)?.name} export is coming soon`);
    }

    setLoading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export to Accounting" size="lg">
      <div>
        {/* Date Range */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Export Period</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
          </div>
        </div>

        {/* Export Format Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Export Format</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.id}
                onClick={() => format.available && setSelectedFormat(format.id)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `2px solid ${selectedFormat === format.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  backgroundColor: selectedFormat === format.id ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                  cursor: format.available ? 'pointer' : 'not-allowed',
                  opacity: format.available ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <format.icon
                  size={22}
                  color={selectedFormat === format.id ? 'var(--color-primary)' : 'var(--color-text-secondary)'}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
                      {format.name}
                    </span>
                    {!format.available && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text-secondary)',
                        fontWeight: 600,
                      }}>
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {format.description}
                  </div>
                </div>
                {selectedFormat === format.id && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        {paySummaryData && paySummaryData.paySummary?.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <label className="form-label">Preview ({paySummaryData.paySummary.length} staff records)</label>
            <div style={{
              maxHeight: '200px',
              overflow: 'auto',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background)' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Employee</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Hours</th>
                    <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Gross Pay</th>
                  </tr>
                </thead>
                <tbody>
                  {paySummaryData.paySummary.map((staff) => (
                    <tr key={staff.staffId} style={{ borderTop: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{staff.staffName}</div>
                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{staff.employeeId}</div>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        {(staff.regularHours + staff.overtimeHours).toFixed(1)}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(staff.grossPay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                      {(paySummaryData.totals.regularHours + paySummaryData.totals.overtimeHours).toFixed(1)}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(paySummaryData.totals.grossPay)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {loadingData && (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            Loading payroll data...
          </div>
        )}

        {!loadingData && paySummaryData && paySummaryData.paySummary?.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '20px',
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
            backgroundColor: 'var(--color-background)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            No approved timesheets found for this period.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleExport}
            disabled={loading || loadingData || !paySummaryData?.paySummary?.length}
            icon={Download}
          >
            {loading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
