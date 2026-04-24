import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDashboardSummary } from '@/lib/dashboard-summary';
import MetricsGrid from '@/components/dashboard/MetricsGrid';
import VisitChart from '@/components/dashboard/VisitChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import UpcomingShifts from '@/components/dashboard/UpcomingShifts';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import EVVWidget from '@/components/dashboard/EVVWidget';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  let summary = null;

  if (session?.user) {
    try {
      summary = await getDashboardSummary(session.user.organizationId, session.user.id);
    } catch (error) {
      console.error('Error loading dashboard summary:', error);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Welcome back! Here&#39;s what&#39;s happening with your clients today.
        </p>
      </div>

      {/* KPI Metrics */}
      <MetricsGrid metrics={summary?.metrics} />

      {/* Charts Row */}
      <div className="dashboard-chart-grid" style={{ marginBottom: '24px' }}>
        <VisitChart data={summary?.visitChart?.data} />
        <RevenueChart data={summary?.revenueChart?.data} />
      </div>

      {/* Bottom Row - Shifts, Invoices, Alerts, EVV */}
      <div className="dashboard-bottom-grid">
        <UpcomingShifts shifts={summary?.upcomingShifts} />
        <RecentInvoices invoices={summary?.recentInvoices} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <EVVWidget data={summary?.evv} />
          <AlertsPanel alerts={summary?.alerts} />
        </div>
      </div>
    </div>
  );
}
