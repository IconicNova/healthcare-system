'use client';

import { useState } from 'react';
import { CheckSquare, X, Download } from 'lucide-react';
import { STATUS_CONFIG } from '@/lib/visit-status-machine';

export default function BatchActions({ visits = [], onStatusChange }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [batchMode, setBatchMode] = useState(false);

  const toggleId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // Expose toggleId for parent checkboxes
  BatchActions.toggleId = toggleId;

  const selectAll = () => {
    setSelectedIds(new Set(visits.map(v => v.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const handleBatchStatus = async (newStatus) => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      try {
        await fetch(`/api/visits/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch (err) {
        console.error('Batch update error:', err);
      }
    }
    onStatusChange?.();
    clearSelection();
  };

  const handleExport = () => {
    const selected = visits.filter(v => selectedIds.has(v.id));
    const csv = [
      'ID,Status,Start,End,Staff',
      ...selected.map(v => `${v.id},${v.status},${v.startTime},${v.endTime},${v.staffName || 'Unassigned'}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'visits-export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!batchMode) {
    return (
      <button
        onClick={() => setBatchMode(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 14px', borderRadius: '8px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'white', fontSize: '12px',
          cursor: 'pointer', color: 'var(--color-text-secondary)',
        }}
      >
        <CheckSquare size={14} />
        Batch Actions
      </button>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 16px', backgroundColor: '#EFF6FF',
      borderRadius: '10px', marginBottom: '16px',
    }}>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#1D4ED8' }}>
        {selectedIds.size} selected
      </span>
      <button onClick={selectAll} style={{ fontSize: '12px', color: '#3B82F6', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
        Select All
      </button>
      <div style={{ flex: 1 }} />
      <select
        onChange={(e) => { if (e.target.value) handleBatchStatus(e.target.value); }}
        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '12px' }}
        defaultValue=""
      >
        <option value="" disabled>Change Status...</option>
        {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
          <option key={key} value={key}>{conf.label}</option>
        ))}
      </select>
      <button
        onClick={handleExport}
        disabled={selectedIds.size === 0}
        style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 12px', borderRadius: '6px',
          border: '1px solid var(--color-border)',
          backgroundColor: 'white', fontSize: '12px',
          cursor: 'pointer',
        }}
      >
        <Download size={12} />
        Export
      </button>
      <button onClick={clearSelection} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
        <X size={16} />
      </button>
    </div>
  );
}
