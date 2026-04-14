'use client';

import { useState } from 'react';
import { ListTodo, FileCheck, FileText, ClipboardList, Activity, Pill } from 'lucide-react';

const NAV_ITEMS = [
  { value: 'tasks', label: 'Tasks', icon: ListTodo },
  { value: 'forms-review', label: 'Forms Review', icon: FileCheck },
  { value: 'progress', label: 'Progress Notes', icon: FileText },
  { value: 'reports', label: 'Visit Reports', icon: ClipboardList },
  { value: 'vitals', label: 'Vitals', icon: Activity },
  { value: 'medications', label: 'Medications', icon: Pill },
];

export default function CareDeliveryLayout({ children, initialTab = 'tasks', client }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '500px' }}>
      {/* Left Sidebar - Sub Navigation */}
      <div style={{
        width: '240px',
        backgroundColor: 'var(--color-white)',
        borderRight: '1px solid var(--color-border)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Client Info */}
        {client && (
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Selected Client
            </div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)' }}>
              {client.firstName} {client.lastName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              {client.address}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {client.city}, {client.state} {client.zipCode}
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', padding: '0 8px' }}>
            Clinical
          </div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                border: 'none',
                backgroundColor: activeTab === item.value ? 'var(--color-primary-light)' : 'transparent',
                color: activeTab === item.value ? 'white' : 'var(--color-text-secondary)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                transition: 'all 0.2s',
                marginBottom: '4px',
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, padding: '24px', overflow: 'auto' }}>
        {children({ activeTab, setActiveTab })}
      </div>
    </div>
  );
}

export { NAV_ITEMS };
