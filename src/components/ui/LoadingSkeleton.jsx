'use client';

export default function LoadingSkeleton({ rows = 3, type = 'list' }) {
  if (type === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              backgroundColor: 'white',
            }}
          >
            <div className="skeleton-pulse" style={{ height: '14px', width: '60%', borderRadius: '4px', marginBottom: '12px', backgroundColor: 'var(--color-gray-100)' }} />
            <div className="skeleton-pulse" style={{ height: '10px', width: '40%', borderRadius: '4px', marginBottom: '8px', backgroundColor: 'var(--color-gray-100)' }} />
            <div className="skeleton-pulse" style={{ height: '10px', width: '80%', borderRadius: '4px', backgroundColor: 'var(--color-gray-100)' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '24px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="skeleton-pulse" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-gray-100)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton-pulse" style={{ height: '14px', width: `${60 + Math.random() * 30}%`, borderRadius: '4px', marginBottom: '8px', backgroundColor: 'var(--color-gray-100)' }} />
            <div className="skeleton-pulse" style={{ height: '10px', width: `${30 + Math.random() * 40}%`, borderRadius: '4px', backgroundColor: 'var(--color-gray-100)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
