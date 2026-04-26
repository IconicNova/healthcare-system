'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/ui/useToast';
import { BreadcrumbLabelsProvider } from '@/components/layout/BreadcrumbLabelsContext';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import LoadingSpinner from '@/components/layout/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function DashboardLayout({ children }) {
  const { status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router, isClient]);

  if (!isClient || status === 'loading') {
    return <LoadingSpinner fullScreen />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <BreadcrumbLabelsProvider>
      <ToastProvider>
        <div className="dashboard-layout">
          <Sidebar
            mobileOpen={mobileMenuOpen}
            onMobileClose={() => setMobileMenuOpen(false)}
          />
          <div className="dashboard-content">
            <TopBar onMenuClick={() => setMobileMenuOpen(true)} />
            <main className="page-container">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
          </div>
        </div>
      </ToastProvider>
    </BreadcrumbLabelsProvider>
  );
}
