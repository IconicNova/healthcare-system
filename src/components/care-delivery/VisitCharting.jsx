'use client';

import { useState } from 'react';
import { Activity, FileText, Pill, CheckSquare } from 'lucide-react';
import VitalsTab from './VitalsTab';
import ProgressNotesTab from './ProgressNotesTab';

const CHART_SECTIONS = [
  { id: 'vitals', label: 'Vitals', icon: Activity },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'meds', label: 'Medications', icon: Pill },
];

export default function VisitCharting({ clientId }) {
  const [activeSection, setActiveSection] = useState('vitals');

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', padding: '4px', backgroundColor: 'var(--color-gray-50)', borderRadius: '10px' }}>
        {CHART_SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '8px 12px', borderRadius: '8px', border: 'none',
              backgroundColor: activeSection === s.id ? 'white' : 'transparent',
              boxShadow: activeSection === s.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              fontSize: '12px', fontWeight: activeSection === s.id ? 600 : 400,
              color: activeSection === s.id ? 'var(--color-text)' : 'var(--color-text-secondary)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <s.icon size={14} />
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'vitals' && <VitalsTab clientId={clientId} />}
      {activeSection === 'notes' && <ProgressNotesTab clientId={clientId} />}
      {activeSection === 'tasks' && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          Tasks are available in the visit detail view
        </div>
      )}
      {activeSection === 'meds' && (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
          <a href="/care-delivery/medications" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Go to Medications page →
          </a>
        </div>
      )}
    </div>
  );
}
