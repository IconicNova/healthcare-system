'use client';

import { useState } from 'react';
import { FileText, CreditCard, Shield } from 'lucide-react';
import BillingSummary from '@/components/billing/BillingSummary';
import InvoiceList from '@/components/billing/InvoiceList';
import PaymentList from '@/components/billing/PaymentList';
import InsuranceClaimList from '@/components/billing/InsuranceClaimList';
import InsuranceClaimForm from '@/components/billing/InsuranceClaimForm';
import InsuranceClaimDetail from '@/components/billing/InsuranceClaimDetail';
import InvoiceForm from '@/components/billing/InvoiceForm';
import InvoiceDetail from '@/components/billing/InvoiceDetail';
import GenerateBatchModal from '@/components/billing/GenerateBatchModal';
import Button from '@/components/ui/Button';
import { hasRoleAccess } from '@/lib/utils';
import { useSession } from '@/lib/auth';

const BILLING_TABS = [
  { value: 'invoices', label: 'Invoices', icon: FileText },
  { value: 'payments', label: 'Payments', icon: CreditCard },
  { value: 'insurance-claims', label: 'Insurance Claims', icon: Shield },
];

export default function BillingPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isClaimFormOpen, setIsClaimFormOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimRefreshKey, setClaimRefreshKey] = useState(0);

  const canCreate = hasRoleAccess(session?.user?.role, ['ADMIN', 'MANAGER']);

  const handleInvoiceClick = async (invoice) => {
    try {
      const response = await fetch(`/api/billing/invoices/${invoice.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedInvoice(data);
      }
    } catch (error) {
      console.error('Error fetching invoice details:', error);
    }
  };

  const handleClaimClick = async (claim) => {
    try {
      const response = await fetch(`/api/billing/insurance-claims/${claim.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedClaim(data.claim);
      }
    } catch (error) {
      console.error('Error fetching claim details:', error);
    }
  };

  const handleRefreshInvoiceList = () => {
    // Trigger refresh - the InvoiceList component handles its own polling
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Billing
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Manage invoices, payments, and insurance claims
        </p>
      </div>

      {/* KPI Summary */}
      <BillingSummary />

      {/* Action Bar */}
      {canCreate && activeTab === 'invoices' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <Button onClick={() => setIsInvoiceModalOpen(true)}>
            Create Invoice
          </Button>
          <Button variant="secondary" onClick={() => setIsBatchModalOpen(true)}>
            Generate from Visits
          </Button>
        </div>
      )}

      {/* Tabs */}
      <div className="card">
        <div className="card-body">
          {/* Custom Tabs Navigation */}
          <div className="tabs">
            {BILLING_TABS.map((tab) => (
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
            {activeTab === 'invoices' && (
              <InvoiceList
                onInvoiceClick={handleInvoiceClick}
                onRefresh={handleRefreshInvoiceList}
              />
            )}
            {activeTab === 'payments' && (
              <PaymentList
                onPaymentRecorded={() => {
                  // Refresh invoice if selected
                  if (selectedInvoice) {
                    setSelectedInvoice(null);
                  }
                }}
              />
            )}
            {activeTab === 'insurance-claims' && (
              <InsuranceClaimList
                key={claimRefreshKey}
                onClaimClick={handleClaimClick}
                onCreateClaim={canCreate ? () => setIsClaimFormOpen(true) : undefined}
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Invoice Modal */}
      {isInvoiceModalOpen && (
        <InvoiceForm
          onSuccess={() => {
            setIsInvoiceModalOpen(false);
            handleRefreshInvoiceList();
          }}
          onCancel={() => setIsInvoiceModalOpen(false)}
        />
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Generate Batch Modal */}
      <GenerateBatchModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => {
          setIsBatchModalOpen(false);
          handleRefreshInvoiceList();
        }}
      />

      {/* Insurance Claim Form Modal */}
      <InsuranceClaimForm
        isOpen={isClaimFormOpen}
        onClose={() => setIsClaimFormOpen(false)}
        onSuccess={() => {
          setClaimRefreshKey(prev => prev + 1);
        }}
      />

      {/* Insurance Claim Detail Modal */}
      {selectedClaim && (
        <InsuranceClaimDetail
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onUpdated={() => {
            setClaimRefreshKey(prev => prev + 1);
            setSelectedClaim(null);
          }}
        />
      )}
    </div>
  );
}
