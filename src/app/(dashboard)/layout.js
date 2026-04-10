'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, isClient]);

  // Handle sidebar collapse state change from Sidebar component
  useEffect(() => {
    const handleSidebarToggle = () => {
      // This will be updated when Sidebar emits state
    };
  }, []);

  if (!isClient || status === 'loading') {
    return <LoadingSpinner fullScreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="dashboard-layout" style={{ display: 'flex', minHeight: '100vh', background: 'var(--gradient-surface)' }}>
      <Sidebar />
      <div className="dashboard-content" style={{
        flex: 1,
        marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        transition: 'margin-left var(--transition-slow) var(--ease-smooth)'
      }}>
        <TopBar onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="sidebar-backdrop visible"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <main className="page-container">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
