'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({ error, reset }) {
  return (
    <div className="page-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
        <div className="card-body" style={{ padding: '48px 32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--color-error-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}
          >
            <AlertTriangle size={28} color="var(--color-error)" />
          </div>

          <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: '24px',
              lineHeight: '1.5',
            }}
          >
            An unexpected error occurred. Please try again or contact support if the issue persists.
          </p>

          {process.env.NODE_ENV === 'development' && error?.message && (
            <div
              style={{
                background: 'var(--color-surface-sunken)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-error)',
                fontFamily: 'var(--font-family-mono)',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={() => reset()}
            style={{ gap: '8px' }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
