'use client';

import { useState } from 'react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  pagination = null,
  renderCell = null,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading-overlay" style={{ minHeight: '200px' }}>
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-description">{emptyMessage}</p>
      </div>
    );
  }

  const getHeaderStyle = (column) => {
    const style = {};

    if (column.width) {
      style.width = column.width;
    }

    if (column.headerAlign) {
      style.textAlign = column.headerAlign;
    }

    return Object.keys(style).length > 0 ? style : undefined;
  };

  const getCellStyle = (column) => {
    const style = {};

    if (column.cellAlign) {
      style.textAlign = column.cellAlign;
    }

    return Object.keys(style).length > 0 ? style : undefined;
  };

  return (
    <>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={column.sortable ? 'sortable' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={getHeaderStyle(column)}
                >
                  {column.label}
                  {sortConfig.key === column.key && (
                    <span style={{ marginLeft: '8px' }}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} style={getCellStyle(column)}>
                    {renderCell ? renderCell(row, column.key) : column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination}
    </>
  );
}
