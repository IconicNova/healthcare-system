'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import LoadingSpinner from '@/components/layout/LoadingSpinner';

export default function DashboardLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

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
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-surface)' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)' }}>
        <TopBar />
        <main className="page-container">
          {children}
        </main>
      </div>
    </div>
  );
}
