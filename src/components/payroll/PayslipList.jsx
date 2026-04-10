'use client';

import { useState, useEffect } from 'react';
import { Receipt, Eye, Printer } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

export default function PayslipList({ onViewPayslip }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [payslips, setPayslips] = useState([]);
  const [summary, setSummary] = useState(null);

  // Default to current month
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

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/payroll/payslips?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayslips(data.payslips);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast('error', 'Error', 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.startDate, dateRange.endDate]);

  const handlePrintAll = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-secondary)' }}>
        Loading payslips...
      </div>
    );
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
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
        <Button onClick={handlePrintAll} variant="secondary" icon={Printer}>
          Print All
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)' }}>Staff</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginTop: '4px' }}>{summary.totalStaff}</div>
          </div>
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)' }}>Gross Pay</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginTop: '4px' }}>{formatCurrency(summary.totalGrossPay)}</div>
          </div>
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)' }}>Deductions</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>{formatCurrency(summary.totalDeductions)}</div>
          </div>
          <div className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)' }}>Net Pay</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>{formatCurrency(summary.totalNetPay)}</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {payslips.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
          <Receipt size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>No Payslips</h3>
          <p style={{ fontSize: '14px', margin: 0 }}>
            No approved timesheets found for this period. Generate and approve timesheets first.
          </p>
        </div>
      )}

      {/* Payslip Cards */}
      {payslips.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {payslips.map((payslip) => (
            <div
              key={payslip.payslipNumber}
              className="card card-hover"
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => { if (onViewPayslip) onViewPayslip(payslip); }}
            >
              <div className="card-body" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  {/* Left: Staff info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '200px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, var(--color-primary-lighter), var(--color-primary))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 700,
                      }}
                    >
                      {payslip.staffName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                        {payslip.staffName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        {payslip.employeeId} • {payslip.payslipNumber}
                      </div>
                    </div>
                  </div>

                  {/* Center: Hours breakdown */}
                  <div style={{ display: 'flex', gap: '24px', flex: 1, justifyContent: 'center', minWidth: '200px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Regular</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{payslip.earnings.regularHours}h</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Overtime</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: payslip.earnings.overtimeHours > 0 ? 'var(--color-warning)' : 'inherit' }}>
                        {payslip.earnings.overtimeHours}h
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Gross</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>{formatCurrency(payslip.earnings.grossPay)}</div>
                    </div>
                  </div>

                  {/* Right: Net pay + action */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Net Pay</div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(payslip.netPay)}
                      </div>
                    </div>
                    <button
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'var(--color-primary-lighter)',
                        color: 'white',
                        cursor: 'pointer',
                      }}
                      title="View Payslip"
                      onClick={(e) => { e.stopPropagation(); if (onViewPayslip) onViewPayslip(payslip); }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
