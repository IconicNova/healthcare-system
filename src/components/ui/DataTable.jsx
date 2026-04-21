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

  const getHeaderCellStyle = (column) => {
    const style = {};

    if (column.width) {
      style.width = column.width;
    }

    if (column.textAlign) {
      style.textAlign = column.textAlign;
    }

    return Object.keys(style).length > 0 ? style : undefined;
  };

  const getBodyCellStyle = (column) => {
    if (!column.textAlign) {
      return undefined;
    }

    return {
      textAlign: column.textAlign,
    };
  };

  const getHeaderContentStyle = (column) => {
    if (!column.headerInsetStart && !column.headerContentWidth) {
      return undefined;
    }

    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginLeft: column.headerInsetStart || '0px',
      width: column.headerContentWidth,
      maxWidth: column.headerContentWidth ? `calc(100% - (${column.headerInsetStart || '0px'}))` : '100%',
      textAlign: 'center',
      verticalAlign: 'middle',
    };
  };

  const renderSortArrow = (column) => {
    if (sortConfig.key !== column.key) {
      return null;
    }

    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const renderHeaderContent = (column) => {
    const sortArrow = renderSortArrow(column);
    const contentStyle = getHeaderContentStyle(column);

    if (!contentStyle) {
      return (
        <>
          {column.label}
          {sortArrow && <span style={{ marginLeft: '8px' }}>{sortArrow}</span>}
        </>
      );
    }

    return (
      <span style={contentStyle}>
        <span>{column.label}</span>
        {sortArrow && <span>{sortArrow}</span>}
      </span>
    );
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
                  style={getHeaderCellStyle(column)}
                >
                  {renderHeaderContent(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column.key} style={getBodyCellStyle(column)}>
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
