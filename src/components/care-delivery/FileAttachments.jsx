'use client';

import { useState, useEffect } from 'react';
import { Paperclip, Upload, Trash2, FileText, Image as ImageIcon } from 'lucide-react';

export default function FileAttachments({ visitId }) {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!visitId) return;
    fetch(`/api/visits/${visitId}/attachments`)
      .then(r => r.ok ? r.json() : { attachments: [] })
      .then(data => setAttachments(data.attachments || []))
      .catch(() => {});
  }, [visitId]);

  const handleFileSelect = async (files) => {
    if (!files.length) return;
    setUploading(true);
    setError('');

    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('files', f));

    try {
      const res = await fetch(`/api/visits/${visitId}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachments(prev => [...prev, ...(data.attachments || [])]);
      } else {
        setError('Upload failed. Max file size is 10MB.');
      }
    } catch (uploadErr) {
      console.error('Upload error:', uploadErr);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await fetch(`/api/attachments/${attachmentId}`, { method: 'DELETE' });
      setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    } catch (err) {
      console.error('Error deleting attachment:', err);
    }
  };

  const getFileIcon = (type) => {
    if (type?.startsWith('image/')) return <ImageIcon size={16} color="#3B82F6" />;
    return <FileText size={16} color="#6B7280" />;
  };

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
          <Paperclip size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Attachments ({attachments.length})
        </h5>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#FEF2F2', borderRadius: '8px', color: '#DC2626', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError('')} style={{ border: 'none', background: 'none', color: '#DC2626', cursor: 'pointer' }}>&times;</button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
        onClick={() => document.getElementById(`file-input-${visitId}`).click()}
        style={{
          padding: '24px',
          border: `2px dashed ${dragOver ? 'var(--color-primary)' : 'var(--color-border)'}`,
          borderRadius: '12px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragOver ? '#EFF6FF' : 'var(--color-gray-50)',
          transition: 'all 0.2s',
          marginBottom: '16px',
        }}
      >
        <Upload size={24} style={{ marginBottom: '8px', color: 'var(--color-text-muted)' }} />
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
          {uploading ? 'Uploading...' : 'Drag & drop or click to upload'}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '4px 0 0 0' }}>
          Photos, documents, PDFs (max 10MB)
        </p>
        <input
          id={`file-input-${visitId}`}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* File list */}
      {attachments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attachments.map(a => (
            <div key={a.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--color-border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {getFileIcon(a.type)}
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {a.size ? `${(a.size / 1024).toFixed(1)} KB` : ''} • {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)} style={{
                border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
                padding: '4px', borderRadius: '4px',
              }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
