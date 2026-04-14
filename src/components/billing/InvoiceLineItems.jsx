'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const createDefaultItems = () => ([
  {
    id: Date.now(),
    description: '',
    quantity: 1,
    unitPrice: 0,
    visitId: null,
    serviceId: null,
  },
]);

export default function InvoiceLineItems({ items, onChange }) {
  const [lineItems, setLineItems] = useState(() => items || createDefaultItems());
  const itemsRef = React.useRef(items);

  // Sync with prop changes without triggering onChange
  React.useEffect(() => {
    const nextItems = items || createDefaultItems();
    const previousItems = itemsRef.current || createDefaultItems();

    if (JSON.stringify(nextItems) !== JSON.stringify(previousItems)) {
      setLineItems(nextItems);
    }
    itemsRef.current = items;
  }, [items]);

  // Notify parent only when user makes changes
  const handleItemsChange = (newItems) => {
    setLineItems(newItems);
    onChange(newItems);
  };

  const addLineItem = () => {
    const newItems = [
      ...lineItems,
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        visitId: null,
        serviceId: null,
      },
    ];
    handleItemsChange(newItems);
  };

  const removeLineItem = (id) => {
    if (lineItems.length > 1) {
      const newItems = lineItems.filter(item => item.id !== id);
      handleItemsChange(newItems);
    }
  };

  const updateLineItem = (id, field, value) => {
    const newItems = lineItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    handleItemsChange(newItems);
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0);
  }, 0);

  const taxRate = 0; // Default 0% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  return (
    <div className="card">
      <div className="card-body">
        <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Line Items</h4>

        {/* Table Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 120px 120px 50px',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>Description</span>
          <span>Qty</span>
          <span>Unit Price</span>
          <span>Amount</span>
          <span style={{ textAlign: 'center' }}> </span>
        </div>

        {/* Line Items */}
        <div style={{ marginTop: '12px' }}>
          {lineItems.map((item) => (
            <div
              key={item.id}
              className="invoice-line-item"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 120px 120px 50px',
                gap: '12px',
                alignItems: 'center',
              }}
            >
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                className="input"
                style={{ fontSize: '13px' }}
              />
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                className="input"
                style={{ fontSize: '13px' }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => updateLineItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                className="input"
                style={{ fontSize: '13px' }}
                placeholder="$0.00"
              />
              <div style={{ fontSize: '13px', fontWeight: 500 }}>
                {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
              </div>
              <button
                type="button"
                onClick={() => removeLineItem(item.id)}
                disabled={lineItems.length === 1}
                style={{
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: lineItems.length === 1 ? 'var(--color-border)' : 'var(--color-error-light)',
                  color: lineItems.length === 1 ? 'var(--color-text-muted)' : 'var(--color-error)',
                  cursor: lineItems.length === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Line Item Button */}
        <button
          type="button"
          onClick={addLineItem}
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px dashed var(--color-border)',
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          Add Line Item
        </button>

        {/* Totals */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Subtotal</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>Tax ({(taxRate * 100).toFixed(0)}%)</span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatCurrency(taxAmount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '16px', fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
