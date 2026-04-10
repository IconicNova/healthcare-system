'use client';

import { Download, Printer } from 'lucide-react';

export default function ExportButton({ onExportCSV, onPrint, variant = 'both' }) {
  const handleCSVExport = () => {
    if (onExportCSV) {
      onExportCSV();
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      {variant === 'both' || variant === 'csv' && (
        <button
          className="btn btn-secondary"
          onClick={handleCSVExport}
          disabled={!onExportCSV}
        >
          <Download size={16} />
          Export CSV
        </button>
      )}
      {variant === 'both' || variant === 'print' && (
        <button className="btn btn-secondary" onClick={handlePrint}>
          <Printer size={16} />
          Print
        </button>
      )}
    </div>
  );
}

export function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Convert data to CSV
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        const escaped = String(value).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    ),
  ];

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
