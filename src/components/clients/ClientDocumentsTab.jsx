'use client';

import { useState, useEffect } from 'react';
import { Upload, File, Download, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';

export default function ClientDocumentsTab({ clientId }) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState([
    {
      id: '1',
      name: 'Care Agreement.pdf',
      type: 'pdf',
      size: '245 KB',
      uploadedAt: new Date('2024-01-15'),
      uploadedBy: 'Admin User',
    },
    {
      id: '2',
      name: 'Insurance Card.pdf',
      type: 'pdf',
      size: '128 KB',
      uploadedAt: new Date('2024-02-20'),
      uploadedBy: 'Jane Smith',
    },
    {
      id: '3',
      name: 'Medical Authorization.pdf',
      type: 'pdf',
      size: '512 KB',
      uploadedAt: new Date('2024-03-10'),
      uploadedBy: 'John Doe',
    },
  ]);

  const handleUpload = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setLoading(true);
      // In a real implementation, this would upload to a server
      setTimeout(() => {
        const newDocs = Array.from(files).map((file, index) => ({
          id: `new-${index}`,
          name: file.name,
          type: file.name.split('.').pop().toLowerCase(),
          size: `${Math.round(file.size / 1024)} KB`,
          uploadedAt: new Date(),
          uploadedBy: 'Current User',
        }));
        setDocuments(prev => [...newDocs, ...prev]);
        setLoading(false);
      }, 1000);
    }
  };

  const getIcon = (type) => {
    const iconColors = {
      pdf: '#dc2626',
      jpg: '#22c55e',
      png: '#22c55e',
      doc: '#2563eb',
      docx: '#2563eb',
      xls: '#16a34a',
      xlsx: '#16a34a',
    };
    const color = iconColors[type] || '#6b7280';
    return <File size={24} color={color} />;
  };

  const formatUploadDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredDocuments = search
    ? documents.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()))
    : documents;

  return (
    <div>
      {/* Header with upload button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SearchInput
          placeholder="Search documents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '300px' }}
        />
        <label>
          <Button>
            <Upload size={16} />
            Upload Document
          </Button>
          <input
            type="file"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Documents Grid */}
      {filteredDocuments.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <File size={48} color="var(--color-border)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                No Documents
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                {search ? 'No documents match your search' : 'Upload documents to get started'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
            >
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ padding: '12px', backgroundColor: `${getIcon(doc.type).props.color}15`, borderRadius: '8px' }}>
                    {getIcon(doc.type)}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      title="View"
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      title="Download"
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    >
                      <Download size={16} />
                    </button>
                    <button
                      title="Delete"
                      style={{
                        padding: '6px',
                        border: 'none',
                        background: 'none',
                        color: 'var(--color-error)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {doc.size}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{formatUploadDate(doc.uploadedAt)}</span>
                  <span>by {doc.uploadedBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload placeholder card */}
      {!search && (
        <label
          className="card"
          style={{
            border: '2px dashed var(--color-border)',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            minHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '32px',
          }}
        >
          <input
            type="file"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Upload size={24} color="white" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
            Drop files here or click to upload
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            PDF, DOC, DOCX, JPG, PNG up to 10MB
          </p>
        </label>
      )}
    </div>
  );
}
