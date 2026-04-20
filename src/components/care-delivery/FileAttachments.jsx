'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Download, AlertCircle } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAttachments({ visitId, onCountChange }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!visitId) return;
    fetchAttachments();
  }, [visitId]);

  const fetchAttachments = async () => {
    try {
      const res = await fetch(`/api/visits/${visitId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        const list = data.attachments || [];
        setAttachments(list);
        onCountChange?.(list.length);
      }
    } catch {
      console.error('Failed to fetch attachments');
    }
  };

  const handleUpload = useCallback(async (files) => {
    if (!files.length) return;
    setError('');
    setUploading(true);
    setUploadProgress(`Uploading ${files.length} file(s)...`);

    // Validate sizes
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 10MB limit`);
        setUploading(false);
        setUploadProgress(null);
        return;
      }
    }

    const formData = new FormData();
    for (const file of files) {
      formData.append('files', file);
    }

    try {
      const res = await fetch(`/api/visits/${visitId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      } else {
        fetchAttachments();
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [visitId]);

  const handleDelete = async (attachmentId) => {
    try {
      const res = await fetch(`/api/visit-attachments/${attachmentId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttachments();
      }
    } catch {
      setError('Delete failed');
    }
    setDeleteConfirm(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleUpload(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleUpload(files);
    e.target.value = ''; // reset input
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📄';
    if (type?.includes('word') || type?.includes('document')) return '📝';
    if (type?.includes('sheet') || type?.includes('excel')) return '📊';
    return '📎';
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Attachments</h3>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          background: dragOver ? 'rgba(59, 130, 246, 0.05)' : 'var(--color-bg)',
          transition: 'all 0.2s ease',
          marginBottom: '16px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
        <Upload size={28} style={{ color: 'var(--color-text-tertiary)', marginBottom: '8px' }} />
        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>
          {uploading ? uploadProgress : 'Drag & drop files or click to browse'}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
          Max 10MB per file
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 14px', borderRadius: '8px',
          background: '#FEE2E2', color: '#B91C1C', fontSize: '13px',
          marginBottom: '12px',
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* File list */}
      {attachments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          No files attached to this visit yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attachments.map(att => (
            <div key={att.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', borderRadius: '8px',
              border: '1px solid var(--color-border)', background: 'var(--color-bg)',
            }}>
              <span style={{ fontSize: '20px' }}>{getFileIcon(att.type)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-tertiary)' }}>
                  {formatFileSize(att.size)}
                  {att.uploadedBy && <> · {att.uploadedBy}</>}
                  {att.createdAt && <> · {new Date(att.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {att.url && (
                  <a
                    href={att.url}
                    download={att.name}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-primary)', padding: '4px',
                      textDecoration: 'none', display: 'flex',
                    }}
                    title="Download"
                  >
                    <Download size={14} />
                  </a>
                )}
                <button
                  onClick={() => setDeleteConfirm(att.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-tertiary)', padding: '4px',
                  }}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10001,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            background: 'var(--color-bg)', borderRadius: '12px',
            padding: '24px', maxWidth: '360px', width: '90%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Delete Attachment?</h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              This file will be permanently deleted.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-bg)', cursor: 'pointer', fontSize: '14px',
              }}>Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                background: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 500,
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
