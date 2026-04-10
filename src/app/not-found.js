import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-surface)' }}>
      <div className="empty-state">
        <FileQuestion className="empty-state-icon" style={{ width: '120px', height: '120px' }} />
        <h1 style={{ fontSize: '48px', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text)' }}>404</h1>
        <h2 className="empty-state-title">Page Not Found</h2>
        <p className="empty-state-description">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
