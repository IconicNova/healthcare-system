'use client';

import { useState, useEffect, useRef } from 'react';
import { Upload, File, Download, Trash2, Eye } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';

export default function ClientDocumentsTab({ clientId }) {
  const [search, setSearch] = useState('');
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!clientId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}/documents?search=${search}`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, search]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (files && files.length > 0 && clientId) {
      setLoading(true);
      try {
        for (const file of files) {
          const extension = file.name.split('.').pop().toLowerCase();
          // Create a blob URL for the uploaded file so it can be viewed/downloaded
          const fileUrl = URL.createObjectURL(file);

          await fetch(`/api/clients/${clientId}/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: file.name,
              type: extension.toUpperCase(),
              url: fileUrl,
              size: file.size,
            }),
          });
        }
        // Refresh documents list
        const response = await fetch(`/api/clients/${clientId}/documents`);
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error('Error uploading documents:', error);
        alert('Failed to upload documents');
      } finally {
        setLoading(false);
      }
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const handleDelete = async (documentId, documentName) => {
    if (!confirm(`Are you sure you want to delete "${documentName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/documents?documentId=${documentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const getIcon = (type) => {
    const ext = type.toLowerCase();
    const iconColors = {
      pdf: '#dc2626',
      jpg: '#22c55e',
      jpeg: '#22c55e',
      png: '#22c55e',
      doc: '#2563eb',
      docx: '#2563eb',
      xls: '#16a34a',
      xlsx: '#16a34a',
    };
    const color = iconColors[ext] || '#6b7280';
    return { icon: <File size={24} />, color };
  };

  const formatBytes = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (date) => {
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
        {clientId && (
          <>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              Upload Document
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              style={{ display: 'none' }}
            />
          </>
        )}
      </div>

      {/* Loading state */}
      {loading && documents.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '16px' }}>
                Loading documents...
              </p>
            </div>
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
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
          {filteredDocuments.map((doc) => {
            const { icon, color } = getIcon(doc.type);
            return (
              <div
                key={doc.id}
                className="card"
                style={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: `${color}15`, borderRadius: '8px' }}>
                      {icon}
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        title="View"
                        onClick={() => window.open(doc.url, '_blank')}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = doc.url;
                          link.download = doc.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
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
                        onClick={(e) => { e.stopPropagation(); handleDelete(doc.id, doc.name); }}
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
                      {formatBytes(doc.size)}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{formatDate(doc.createdAt)}</span>
                    <span>by {doc.uploadedBy || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload placeholder card */}
      {!search && filteredDocuments.length > 0 && clientId && (
        <div
          className="card"
          onClick={() => fileInputRef.current?.click()}
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
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-primary-lighter)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Upload size={24} color="white" />
          </div>
          <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
            Drop files here or click to upload
          </h4>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            PDF, DOC, DOCX, JPG, PNG up to 10MB
          </p>
        </div>
      )}
    </div>
  );
}
