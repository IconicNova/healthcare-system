'use client';

import { useState } from 'react';
import { FileText, DollarSign, Receipt, FileDown } from 'lucide-react';
import PayrollSummary from '@/components/payroll/PayrollSummary';
import TimesheetList from '@/components/payroll/TimesheetList';
import PaySummaryTable from '@/components/payroll/PaySummaryTable';
import PayslipList from '@/components/payroll/PayslipList';
import PayslipDetail from '@/components/payroll/PayslipDetail';
import TimesheetDetail from '@/components/payroll/TimesheetDetail';
import GenerateTimesheetModal from '@/components/payroll/GenerateTimesheetModal';
import ExportAccountingModal from '@/components/payroll/ExportAccountingModal';
import Button from '@/components/ui/Button';
import { hasRoleAccess } from '@/lib/utils';
import { useSession } from '@/lib/auth';

const PAYROLL_TABS = [
  { value: 'timesheets', label: 'Timesheets', icon: FileText },
  { value: 'pay-summary', label: 'Pay Summary', icon: DollarSign },
  { value: 'payslips', label: 'Payslips', icon: Receipt },
];

export default function PayrollPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('timesheets');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedTimesheet, setSelectedTimesheet] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  const canGenerate = hasRoleAccess(session?.user?.role, ['ADMIN', 'MANAGER']);

  const handleTimesheetClick = async (timesheet) => {
    try {
      const response = await fetch(`/api/payroll/timesheets/${timesheet.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedTimesheet(data);
      }
    } catch (error) {
      console.error('Error fetching timesheet details:', error);
    }
  };

  const handleRefreshTimesheets = () => {
    // Trigger refresh - the TimesheetList component handles its own polling
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Payroll
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage timesheets, payslips, and accounting exports
        </p>
      </div>

      {/* KPI Summary */}
      <PayrollSummary />

      {/* Action Bar */}
      {canGenerate && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          {activeTab === 'timesheets' && (
            <Button onClick={() => setIsGenerateModalOpen(true)}>
              Generate Timesheets
            </Button>
          )}
          <Button variant="secondary" icon={FileDown} onClick={() => setIsExportModalOpen(true)}>
            Export to Accounting
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="card-body">
          {/* Custom Tabs Navigation */}
          <div className="tabs">
            {PAYROLL_TABS.map((tab) => (
              <button
                key={tab.value}
                className={`tab ${activeTab === tab.value ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.icon && <tab.icon size={16} style={{ marginRight: '8px' }} />}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ marginTop: '20px' }}>
            {activeTab === 'timesheets' && (
              <TimesheetList
                onTimesheetClick={handleTimesheetClick}
                onRefresh={handleRefreshTimesheets}
              />
            )}
            {activeTab === 'pay-summary' && <PaySummaryTable />}
            {activeTab === 'payslips' && (
              <PayslipList
                onViewPayslip={(payslip) => setSelectedPayslip(payslip)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Generate Timesheets Modal */}
      <GenerateTimesheetModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={() => {
          setIsGenerateModalOpen(false);
          handleRefreshTimesheets();
        }}
      />

      {/* Timesheet Detail Modal */}
      {selectedTimesheet && (
        <TimesheetDetail
          timesheet={selectedTimesheet}
          onClose={() => setSelectedTimesheet(null)}
          onUpdated={() => {
            // Refresh the timesheet data
            handleTimesheetClick(selectedTimesheet);
          }}
        />
      )}

      {/* Payslip Detail Modal */}
      {selectedPayslip && (
        <PayslipDetail
          payslip={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
      )}

      {/* Export to Accounting Modal */}
      <ExportAccountingModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
