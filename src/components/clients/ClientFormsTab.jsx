'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import StatusBadge from '@/components/ui/StatusBadge';
import Pagination from '@/components/ui/Pagination';
import SearchInput from '@/components/ui/SearchInput';
import { FileText, Eye } from 'lucide-react';
import { normalizeFormStatus } from '@/lib/form-review';

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  IN_REVIEW: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
};

const FORM_TYPES = [
  { value: '', label: 'All Forms' },
  { value: 'Assessment', label: 'Assessments' },
  { value: 'Documentation', label: 'Documentation' },
  { value: 'Orders', label: 'Orders' },
  { value: 'Vitals', label: 'Vitals' },
  { value: 'Other', label: 'Other' },
];

export default function ClientFormsTab({ clientId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    async function fetchForms() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        });
        if (typeFilter) params.append('type', typeFilter);

        const response = await fetch(`/api/clients/${clientId}/forms?${params}`);
        if (response.ok) {
          const data = await response.json();
          setForms((data.forms || []).map((form) => ({
            ...form,
            status: normalizeFormStatus(form.status),
          })));
          setPagination(data.pagination);
        }
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, pagination.page, typeFilter]);

  // Filter by search locally
  const filteredForms = search
    ? forms.filter(form =>
        form.name.toLowerCase().includes(search.toLowerCase()) ||
        form.type.toLowerCase().includes(search.toLowerCase())
      )
    : forms;

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  if (loading && forms.length === 0) {
    return <div>Loading forms...</div>;
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <SearchInput
          placeholder="Search forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, maxWidth: '250px' }}
        />
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPagination(prev => ({ ...prev, page: 1 }));
          }}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '14px',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-background)',
            cursor: 'pointer',
          }}
        >
          {FORM_TYPES.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
          {filteredForms.length} form{filteredForms.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {/* Forms List */}
      {filteredForms.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <FileText size={48} color="var(--color-border)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                No Forms Found
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {search ? 'Try adjusting your search' : 'No forms are available for this client yet'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body" style={{ padding: 0 }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Form Name</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reviewed</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reviewer</th>
                    <th style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textAlign: 'left', padding: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredForms.map((form, index) => {
                        return (
                        <tr key={form.id} style={{ borderBottom: index < filteredForms.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FileText size={18} color="#0284c7" />
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{form.name}</div>
                              {form.rejectionReason && (
                                <div style={{ fontSize: '11px', color: 'var(--color-error)', marginTop: '4px' }}>
                                  {form.rejectionReason}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{form.type}</span>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StatusBadge status={form.status} variant={STATUS_VARIANTS[form.status] || 'default'} />
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {form.submittedAt ? format(new Date(form.submittedAt), 'MMM d, yyyy') : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {form.reviewedAt ? format(new Date(form.reviewedAt), 'MMM d, yyyy') : '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                            {form.reviewedBy || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <button
                            onClick={() => router.push(`/care-delivery/forms/${form.formId}`)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--color-border)',
                              backgroundColor: 'transparent',
                              color: 'var(--color-primary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 500,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Eye size={14} />
                            View Form
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredForms.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          total={pagination.total}
        />
      )}
    </div>
  );
}
