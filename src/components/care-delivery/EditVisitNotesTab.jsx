'use client';

import { FileText } from 'lucide-react';

export default function EditVisitNotesTab() {
  return (
    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
      <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
      <p style={{ fontSize: '14px', fontWeight: 500 }}>Visit Notes</p>
      <p style={{ fontSize: '12px', marginTop: '8px' }}>Notes for this visit will appear here</p>
    </div>
  );
}
