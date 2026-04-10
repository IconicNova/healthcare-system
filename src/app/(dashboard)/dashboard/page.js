import MetricsGrid from '@/components/dashboard/MetricsGrid';
import VisitChart from '@/components/dashboard/VisitChart';
import RevenueChart from '@/components/dashboard/RevenueChart';
import UpcomingShifts from '@/components/dashboard/UpcomingShifts';
import RecentInvoices from '@/components/dashboard/RecentInvoices';
import AlertsPanel from '@/components/dashboard/AlertsPanel';
import EVVWidget from '@/components/dashboard/EVVWidget';

export default function DashboardPage() {
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
      <MetricsGrid />

      {/* Charts Row */}
      <div className="dashboard-chart-grid" style={{ marginBottom: '24px' }}>
        <VisitChart />
        <RevenueChart />
      </div>

      {/* Bottom Row - Shifts, Invoices, Alerts, EVV */}
      <div className="dashboard-bottom-grid">
        <UpcomingShifts />
        <RecentInvoices />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <EVVWidget />
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
