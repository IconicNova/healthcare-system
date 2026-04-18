'use client';

/**
 * EmptyState component with inline SVG illustrations.
 * Usage: <EmptyState type="visits" title="No visits" description="..." />
 */

const ILLUSTRATIONS = {
  visits: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="#F0F4FF"/>
    <rect x="35" y="30" width="50" height="60" rx="6" fill="white" stroke="#CBD5E1" strokeWidth="2"/>
    <line x1="45" y1="45" x2="75" y2="45" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="45" y1="55" x2="70" y2="55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="45" y1="65" x2="65" y2="65" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="80" cy="80" r="18" fill="#3B82F6" opacity="0.1"/>
    <path d="M74 80L78 84L86 76" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>`,
  notes: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="#F0FDF4"/>
    <rect x="30" y="25" width="55" height="65" rx="6" fill="white" stroke="#CBD5E1" strokeWidth="2"/>
    <line x1="40" y1="40" x2="75" y2="40" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="50" x2="72" y2="50" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="60" x2="68" y2="60" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="70" x2="60" y2="70" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
  </svg>`,
  medications: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="#FFF7ED"/>
    <rect x="40" y="35" width="40" height="50" rx="20" fill="white" stroke="#CBD5E1" strokeWidth="2"/>
    <line x1="40" y1="60" x2="80" y2="60" stroke="#E2E8F0" strokeWidth="2"/>
    <rect x="40" y="60" width="40" height="25" rx="0" fill="#3B82F6" opacity="0.15"/>
  </svg>`,
  vitals: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="#FEF2F2"/>
    <path d="M30 60 L45 60 L50 45 L55 75 L60 50 L65 70 L70 55 L75 60 L90 60" stroke="#EF4444" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="60" cy="60" r="25" stroke="#FCA5A5" strokeWidth="1" fill="none" strokeDasharray="4 4"/>
  </svg>`,
  default: `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="60" cy="60" r="55" fill="#F8FAFC"/>
    <rect x="35" y="35" width="50" height="50" rx="8" fill="white" stroke="#CBD5E1" strokeWidth="2"/>
    <line x1="50" y1="55" x2="70" y2="55" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
    <line x1="50" y1="65" x2="65" y2="65" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round"/>
  </svg>`,
};

export default function EmptyState({ type = 'default', title, description }) {
  const svg = ILLUSTRATIONS[type] || ILLUSTRATIONS.default;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', textAlign: 'center',
    }}>
      <div
        style={{ marginBottom: '16px', opacity: 0.8 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {title && (
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 6px 0' }}>
          {title}
        </p>
      )}
      {description && (
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0, maxWidth: '300px' }}>
          {description}
        </p>
      )}
    </div>
  );
}
