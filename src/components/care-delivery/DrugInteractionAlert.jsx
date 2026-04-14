'use client';

import { AlertTriangle, X, AlertCircle } from 'lucide-react';

const SEVERITY_CONFIG = {
  LOW: { color: '#F59E0B', bgColor: '#FEF3C7', icon: AlertTriangle, label: 'Low Severity' },
  MODERATE: { color: '#EA580C', bgColor: '#FFEDD5', icon: AlertTriangle, label: 'Moderate Severity' },
  HIGH: { color: '#DC2626', bgColor: '#FEE2E2', icon: AlertCircle, label: 'High Severity' },
  CONTRAINDICATED: { color: '#991B1B', bgColor: '#FEE2E2', icon: AlertCircle, label: 'Contraindicated' },
};

export default function DrugInteractionAlert({ interactions, onDismiss }) {
  if (!interactions || interactions.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '16px' }}>
      {interactions.map((interaction, idx) => {
        const config = SEVERITY_CONFIG[interaction.severity] || SEVERITY_CONFIG.MODERATE;
        const Icon = config.icon;

        return (
          <div
            key={idx}
            style={{
              padding: '16px',
              borderRadius: '12px',
              backgroundColor: config.bgColor,
              border: `1px solid ${config.color}30`,
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                <Icon size={20} style={{ color: config.color, flexShrink: 0 }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: config.color, textTransform: 'uppercase' }}>
                      {config.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '8px' }}>
                    {interaction.drug1} + {interaction.drug2}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '8px', lineHeight: 1.5 }}>
                    {interaction.description}
                  </div>
                  {interaction.recommendation && (
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.5 }}>
                      <strong>Recommendation:</strong> {interaction.recommendation}
                    </div>
                  )}
                </div>
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(idx)}
                  style={{
                    padding: '4px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: config.color,
                    cursor: 'pointer',
                    opacity: 0.7,
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
