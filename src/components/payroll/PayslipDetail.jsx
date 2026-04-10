'use client';

import { Printer, Download, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

export default function PayslipDetail({ payslip, onClose }) {
  const toast = useToast();

  if (!payslip) return null;

  const periodStart = new Date(payslip.period.startDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
  const periodEnd = new Date(payslip.period.endDate).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast('info', 'Info', 'PDF generation coming soon. Use Print → Save as PDF for now.');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header (hidden in print) */}
        <div className="modal-header no-print" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="modal-title" style={{ margin: 0 }}>Payslip — {payslip.payslipNumber}</h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="secondary" icon={Printer} onClick={handlePrint}>Print</Button>
            <Button variant="secondary" icon={Download} onClick={handleDownload}>PDF</Button>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Payslip Content — print-friendly */}
        <div className="payslip-content" style={{ padding: '32px' }}>
          {/* Company Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '32px',
            paddingBottom: '20px',
            borderBottom: '3px solid var(--color-primary)',
          }}>
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 800, 
                color: 'var(--color-primary)', 
                margin: '0 0 4px',
                letterSpacing: '-0.5px',
              }}>
                Together Care Health Services
              </h2>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                Home Care Management System<br />
                Pay Statement
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--color-text)',
                backgroundColor: 'var(--color-background)',
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}>
                {payslip.payslipNumber}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                {periodStart} — {periodEnd}
              </div>
            </div>
          </div>

          {/* Employee Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '28px',
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: 'var(--color-background)',
            border: '1px solid var(--color-border)',
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Employee
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)' }}>
                {payslip.staffName}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                {payslip.role} • {payslip.employeeId}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                {payslip.email}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                Pay Details
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                Pay Type: <strong>{payslip.payType}</strong>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', marginTop: '2px' }}>
                Rate: <strong>{payslip.payType === 'HOURLY' ? `$${payslip.payRate.toFixed(2)}/hr` : `$${payslip.payRate.toFixed(0)}/yr`}</strong>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)', marginTop: '2px' }}>
                Timesheets: <strong>{payslip.timesheetCount}</strong>
              </div>
            </div>
          </div>

          {/* Earnings Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Earnings
            </h4>
            <table className="payslip-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Hours</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Regular Pay</td>
                  <td style={{ textAlign: 'right' }}>{payslip.earnings.regularHours}</td>
                  <td style={{ textAlign: 'right' }}>${payslip.payRate.toFixed(2)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.earnings.regularPay)}</td>
                </tr>
                {payslip.earnings.overtimeHours > 0 && (
                  <tr>
                    <td>Overtime Pay (1.5×)</td>
                    <td style={{ textAlign: 'right' }}>{payslip.earnings.overtimeHours}</td>
                    <td style={{ textAlign: 'right' }}>${(payslip.payRate * 1.5).toFixed(2)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-warning)' }}>
                      {formatCurrency(payslip.earnings.overtimePay)}
                    </td>
                  </tr>
                )}
                {payslip.earnings.mileagePay > 0 && (
                  <tr>
                    <td>Mileage Reimbursement</td>
                    <td style={{ textAlign: 'right' }}>—</td>
                    <td style={{ textAlign: 'right' }}>$0.67/mi</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.earnings.mileagePay)}</td>
                  </tr>
                )}
                <tr className="payslip-total-row">
                  <td colSpan="3" style={{ fontWeight: 700 }}>Gross Pay</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '15px' }}>
                    {formatCurrency(payslip.earnings.grossPay)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deductions Table */}
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Deductions (Estimated)
            </h4>
            <table className="payslip-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Federal Income Tax</td>
                  <td style={{ textAlign: 'right' }}>12.00%</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-error)' }}>
                    −{formatCurrency(payslip.deductions.federalTax)}
                  </td>
                </tr>
                <tr>
                  <td>State Income Tax</td>
                  <td style={{ textAlign: 'right' }}>5.00%</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-error)' }}>
                    −{formatCurrency(payslip.deductions.stateTax)}
                  </td>
                </tr>
                <tr>
                  <td>FICA (Social Security + Medicare)</td>
                  <td style={{ textAlign: 'right' }}>7.65%</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-error)' }}>
                    −{formatCurrency(payslip.deductions.fica)}
                  </td>
                </tr>
                <tr className="payslip-total-row">
                  <td colSpan="2" style={{ fontWeight: 700 }}>Total Deductions</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-error)' }}>
                    −{formatCurrency(payslip.deductions.totalDeductions)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Net Pay */}
          <div style={{
            padding: '20px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #059669, #10b981)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, opacity: 0.9 }}>NET PAY</div>
              <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '2px' }}>
                After all deductions
              </div>
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800 }}>
              {formatCurrency(payslip.netPay)}
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
            padding: '12px',
            borderTop: '1px solid var(--color-border)',
          }}>
            This is an estimated pay statement. Tax withholdings are approximations.
            Actual amounts may vary based on individual tax situations and elections.
          </div>
        </div>
      </div>
    </div>
  );
}
