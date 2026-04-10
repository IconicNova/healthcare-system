'use client';

import { useState } from 'react';
import {
  Shield, FileText, DollarSign, Send,
  CheckCircle, XCircle, AlertTriangle, X
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/useToast';

const STATUS_COLORS = {
  PENDING: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
  SUBMITTED: { bg: '#dbeafe', text: '#1e40af', label: 'Submitted' },
  IN_REVIEW: { bg: '#e0e7ff', text: '#3730a3', label: 'In Review' },
  APPROVED: { bg: '#dcfce7', text: '#166534', label: 'Approved' },
  DENIED: { bg: '#fee2e2', text: '#991b1b', label: 'Denied' },
  APPEALED: { bg: '#fef3c7', text: '#92400e', label: 'Appealed' },
  PAID: { bg: '#dcfce7', text: '#166534', label: 'Paid' },
  VOIDED: { bg: '#f3f4f6', text: '#6b7280', label: 'Voided' },
};

const NEXT_ACTIONS = {
  PENDING: [{ status: 'SUBMITTED', label: 'Submit to Insurance', icon: Send, color: 'var(--color-primary)' }],
  SUBMITTED: [
    { status: 'IN_REVIEW', label: 'Mark In Review', icon: FileText, color: 'var(--color-info, #3b82f6)' },
  ],
  IN_REVIEW: [
    { status: 'APPROVED', label: 'Approve', icon: CheckCircle, color: 'var(--color-success)' },
    { status: 'DENIED', label: 'Deny', icon: XCircle, color: 'var(--color-error)' },
  ],
  DENIED: [
    { status: 'APPEALED', label: 'File Appeal', icon: AlertTriangle, color: 'var(--color-warning)' },
    { status: 'VOIDED', label: 'Void', icon: X, color: 'var(--color-text-secondary)' },
  ],
  APPEALED: [
    { status: 'APPROVED', label: 'Approve', icon: CheckCircle, color: 'var(--color-success)' },
    { status: 'DENIED', label: 'Deny Again', icon: XCircle, color: 'var(--color-error)' },
  ],
  APPROVED: [
    { status: 'PAID', label: 'Mark as Paid', icon: DollarSign, color: 'var(--color-success)' },
  ],
};

export default function InsuranceClaimDetail({ claim, onClose, onUpdated }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [denialReason, setDenialReason] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(claim?.approvedAmount || '');
  const [showDenialInput, setShowDenialInput] = useState(false);
  const [showApprovalInput, setShowApprovalInput] = useState(false);

  if (!claim) return null;

  const statusInfo = STATUS_COLORS[claim.status] || STATUS_COLORS.PENDING;
  const actions = NEXT_ACTIONS[claim.status] || [];

  const handleStatusUpdate = async (newStatus) => {
    // For DENIED, show input first
    if (newStatus === 'DENIED' && !showDenialInput) {
      setShowDenialInput(true);
      setShowApprovalInput(false);
      return;
    }

    // For APPROVED, show approved amount input
    if (newStatus === 'APPROVED' && !showApprovalInput) {
      setShowApprovalInput(true);
      setShowDenialInput(false);
      setApprovedAmount(claim.amount);
      return;
    }

    setLoading(true);
    try {
      const body = { status: newStatus };
      if (newStatus === 'DENIED') body.denialReason = denialReason;
      if (newStatus === 'APPROVED') body.approvedAmount = parseFloat(approvedAmount) || claim.amount;

      const response = await fetch(`/api/billing/insurance-claims/${claim.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast('success', 'Success', `Claim status updated to ${STATUS_COLORS[newStatus]?.label || newStatus}`);
        setShowDenialInput(false);
        setShowApprovalInput(false);
        if (onUpdated) onUpdated();
      } else {
        const data = await response.json();
        toast('error', 'Error', data.error || 'Failed to update claim');
      }
    } catch {
      toast('error', 'Error', 'Failed to update claim status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh', overflow: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={20} color="var(--color-primary)" />
            <h3 className="modal-title" style={{ margin: 0 }}>
              Insurance Claim — {claim.claimNumber}
            </h3>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: statusInfo.bg,
                color: statusInfo.text,
              }}
            >
              {statusInfo.label}
            </span>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '24px' }}>
          {/* Info Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '24px',
          }}>
            {/* Client Info */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Client
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                {claim.clientName}
              </div>
            </div>

            {/* Insurance Info */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Insurance
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                {claim.insuranceType}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Policy: {claim.insuranceId}
              </div>
            </div>

            {/* Linked Invoice */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Invoice
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-primary)' }}>
                {claim.invoiceNumber}
              </div>
            </div>

            {/* Service Date */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Service Date
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
                {formatDate(claim.serviceDate)}
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '16px',
              marginBottom: '24px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--color-primary-lighter) 0%, rgba(99,102,241,0.1) 100%)',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Claimed Amount</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>
                {formatCurrency(claim.amount)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Approved Amount</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: 'white' }}>
                {claim.approvedAmount != null ? formatCurrency(claim.approvedAmount) : '—'}
              </div>
            </div>
            {claim.approvedAmount != null && claim.amount !== claim.approvedAmount && (
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Difference</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: '#fbbf24' }}>
                  {formatCurrency(claim.amount - claim.approvedAmount)}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Diagnosis Code (ICD-10)</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                {claim.diagnosisCode || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Authorization #</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                {claim.authorizationNumber || '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Submitted Date</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                {claim.submittedDate ? formatDate(claim.submittedDate) : '—'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Response Date</div>
              <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>
                {claim.responseDate ? formatDate(claim.responseDate) : '—'}
              </div>
            </div>
          </div>

          {/* Denial Reason */}
          {claim.denialReason && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#fee2e2',
                border: '1px solid #fca5a5',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>
                Denial Reason
              </div>
              <div style={{ fontSize: '13px', color: '#7f1d1d' }}>{claim.denialReason}</div>
            </div>
          )}

          {/* Notes */}
          {claim.notes && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Notes</div>
              <div style={{ fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                {claim.notes}
              </div>
            </div>
          )}

          {/* Denial Reason Input */}
          {showDenialInput && (
            <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
              <label className="form-label">Denial Reason</label>
              <textarea
                className="input"
                rows={2}
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                placeholder="Reason for denial..."
                style={{ resize: 'vertical', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  onClick={() => handleStatusUpdate('DENIED')}
                  disabled={loading || !denialReason}
                  style={{ backgroundColor: 'var(--color-error)' }}
                >
                  Confirm Denial
                </Button>
                <Button variant="secondary" onClick={() => setShowDenialInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Approved Amount Input */}
          {showApprovalInput && (
            <div style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background)' }}>
              <label className="form-label">Approved Amount</label>
              <input
                type="number"
                className="input"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                step="0.01"
                min="0"
                style={{ marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={() => handleStatusUpdate('APPROVED')} disabled={loading}>
                  Confirm Approval
                </Button>
                <Button variant="secondary" onClick={() => setShowApprovalInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && !showDenialInput && !showApprovalInput && (
            <div style={{ display: 'flex', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              {actions.map((action) => (
                <Button
                  key={action.status}
                  onClick={() => handleStatusUpdate(action.status)}
                  disabled={loading}
                  icon={action.icon}
                  style={{ backgroundColor: action.color }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
