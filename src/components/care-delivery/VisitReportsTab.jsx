'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Calendar, Download, Eye, X, Trash2 } from 'lucide-react';
import VisitReportBuilder from './VisitReportBuilder';

const REPORT_TYPE_CONFIG = {
  VISIT_SUMMARY: { label: 'Visit Summary', color: '#3B82F6', description: 'Single visit documentation' },
  PERIOD_SUMMARY: { label: 'Period Summary', color: '#10B981', description: 'Daily, weekly, or monthly aggregation' },
};

export default function VisitReportsTab({ clientId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) return;

    const fetchReports = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/reports`);
        if (response.ok) {
          const data = await response.json();
          setReports(data.reports || []);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [clientId]);

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
        setError('');
      } else {
        setError('Failed to delete report');
      }
    } catch (err) {
      console.error('Error deleting report:', err);
      setError('Failed to delete report');
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  if (!clientId) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        <p style={{ fontSize: '14px' }}>Select a client to view visit reports</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {error && (
        <div style={{ padding: '12px 16px', marginBottom: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#DC2626', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError('')} style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer', fontSize: '16px' }}>&times;</button>
        </div>
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Visit Reports</h4>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
            Generate and view visit summaries and period reports
          </p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          New Report
        </button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--color-gray-50)', borderRadius: '12px' }}>
          <FileText size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>No reports yet. Create your first report to document visits.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map(report => {
            const config = REPORT_TYPE_CONFIG[report.type] || REPORT_TYPE_CONFIG.VISIT_SUMMARY;

            return (
              <div
                key={report.id}
                style={{
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: `${config.color}15`,
                      color: config.color,
                    }}>
                      {config.label}
                    </span>
                    {report.period && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {report.period}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setViewingReport(report)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="View report"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => {
                        setViewingReport(report);
                        setTimeout(() => window.print(), 300);
                      }}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="Download report as PDF"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      style={{
                        padding: '4px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#EF4444',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title="Delete report"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {report.summary && (
                  <div style={{ marginBottom: '12px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {report.summary.substring(0, 200)}{report.summary.length > 200 ? '...' : ''}
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    <Calendar size={12} />
                    {formatDateRange(report.startDate, report.endDate)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                    Generated: {new Date(report.generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Builder Modal */}
      {showBuilder && (
        <VisitReportBuilder
          clientId={clientId}
          onClose={() => setShowBuilder(false)}
          onSuccess={() => {
            setShowBuilder(false);
            const fetchReports = async () => {
              const response = await fetch(`/api/clients/${clientId}/reports`);
              if (response.ok) {
                const data = await response.json();
                setReports(data.reports || []);
              }
            };
            fetchReports();
          }}
        />
      )}

      {/* Report Viewer Modal */}
      {viewingReport && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 500,
          }}
          onClick={() => setViewingReport(null)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Report Details</h4>
              <button
                onClick={() => setViewingReport(null)}
                style={{
                  padding: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Summary</h5>
              <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                {viewingReport.summary || 'No summary available.'}
              </p>
            </div>

            {viewingReport.clientCondition && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Client Condition</h5>
                <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.8 }}>
                  {viewingReport.clientCondition}
                </p>
              </div>
            )}

            {viewingReport.notableEvents && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Notable Events</h5>
                <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.8 }}>
                  {viewingReport.notableEvents}
                </p>
              </div>
            )}

            {viewingReport.recommendations && (
              <div style={{ marginBottom: '16px' }}>
                <h5 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Recommendations</h5>
                <p style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.8 }}>
                  {viewingReport.recommendations}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setViewingReport(null)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'white',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
