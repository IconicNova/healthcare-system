'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Filter, FileText } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'Reviewable' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

const STATUS_STYLES = {
  SUBMITTED: {
    backgroundColor: 'var(--color-primary-light)',
    color: 'white',
  },
  IN_REVIEW: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
  },
  APPROVED: {
    backgroundColor: 'var(--color-success-light)',
    color: '#065f46',
  },
  REJECTED: {
    backgroundColor: 'var(--color-error-light)',
    color: '#991b1b',
  },
};

function formatClientName(client) {
  if (!client) {
    return 'Unknown Client';
  }

  return `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Unknown Client';
}

function formatStatusLabel(status) {
  return status.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function FormsReviewQueue({ clientId = '', embedded = false }) {
  const router = useRouter();
  const [forms, setForms] = useState([]);
  const [clients, setClients] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    clientId,
    templateId: '',
    dateFrom: '',
    dateTo: '',
  });

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      clientId,
    }));
  }, [clientId]);

  useEffect(() => {
    async function fetchFilterOptions() {
      try {
        const [clientsResponse, templatesResponse] = await Promise.all([
          fetch('/api/clients?limit=100'),
          fetch('/api/forms/templates'),
        ]);

        if (clientsResponse.ok) {
          const clientData = await clientsResponse.json();
          setClients(clientData.clients || []);
        }

        if (templatesResponse.ok) {
          const templateData = await templatesResponse.json();
          setTemplates(templateData.templates || []);
        }
      } catch (fetchError) {
        console.error('Error fetching review queue filter options:', fetchError);
      }
    }

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            params.set(key, value);
          }
        });

        const response = await fetch(`/api/forms/review?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load forms review queue');
        }

        const data = await response.json();
        setForms(data.forms || []);
      } catch (fetchError) {
        console.error('Error fetching review queue forms:', fetchError);
        setError('Failed to load forms review queue');
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
  }, [filters]);

  const summary = useMemo(() => ({
    total: forms.length,
    submitted: forms.filter((form) => form.status === 'SUBMITTED').length,
    inReview: forms.filter((form) => form.status === 'IN_REVIEW').length,
  }), [forms]);

  const handleFilterChange = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <div>
      {!embedded && (
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Forms Review
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Review submitted charting forms across all clients
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <div className="card" style={{ padding: '12px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Queue</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>{summary.total}</div>
            </div>
            <div className="card" style={{ padding: '12px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Submitted</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>{summary.submitted}</div>
            </div>
            <div className="card" style={{ padding: '12px 16px', minWidth: '120px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>In Review</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)' }}>{summary.inReview}</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Filter size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Filters
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <select
              className="select"
              value={filters.status}
              onChange={(event) => handleFilterChange('status', event.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              className="select"
              value={filters.clientId}
              onChange={(event) => handleFilterChange('clientId', event.target.value)}
              disabled={Boolean(clientId)}
            >
              <option value="">All Clients</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={filters.templateId}
              onChange={(event) => handleFilterChange('templateId', event.target.value)}
            >
              <option value="">All Templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                From
              </label>
              <input
                type="date"
                className="input"
                aria-label="Filter from date"
                value={filters.dateFrom}
                onChange={(event) => handleFilterChange('dateFrom', event.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                To
              </label>
              <input
                type="date"
                className="input"
                aria-label="Filter to date"
                value={filters.dateTo}
                onChange={(event) => handleFilterChange('dateTo', event.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-error)' }}>
              {error}
            </div>
          ) : forms.length === 0 ? (
            <div style={{ padding: '56px 24px', textAlign: 'center' }}>
              <FileText size={40} color="var(--color-border)" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' }}>
                No forms match the current review filters
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                Adjust the queue filters or wait for new submitted forms.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                    <th style={headerCellStyle}>Client</th>
                    <th style={headerCellStyle}>Form</th>
                    <th style={headerCellStyle}>Visit</th>
                    <th style={headerCellStyle}>Submitted</th>
                    <th style={headerCellStyle}>Status</th>
                    <th style={headerCellStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form, index) => (
                    <tr
                      key={form.id}
                      style={{
                        borderBottom: index < forms.length - 1 ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      <td style={bodyCellStyle}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                          {formatClientName(form.client)}
                        </div>
                      </td>
                      <td style={bodyCellStyle}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
                          {form.template?.name || 'Untitled Form'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {form.template?.category || 'Other'}
                        </div>
                      </td>
                      <td style={bodyCellStyle}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {form.visit?.title || 'Visit'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {form.visit?.startTime ? new Date(form.visit.startTime).toLocaleString() : 'No linked visit'}
                        </div>
                      </td>
                      <td style={bodyCellStyle}>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {form.submittedAt ? new Date(form.submittedAt).toLocaleString() : '-'}
                        </div>
                      </td>
                      <td style={bodyCellStyle}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 600,
                            ...(STATUS_STYLES[form.status] || {
                              backgroundColor: 'var(--color-gray-100)',
                              color: 'var(--color-text-secondary)',
                            }),
                          }}
                        >
                          {formatStatusLabel(form.status)}
                        </span>
                      </td>
                      <td style={bodyCellStyle}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => router.push(`/care-delivery/forms/${form.id}`)}
                        >
                          <Eye size={14} />
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const headerCellStyle = {
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textAlign: 'left',
  padding: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const bodyCellStyle = {
  padding: '16px 12px',
  verticalAlign: 'top',
};
