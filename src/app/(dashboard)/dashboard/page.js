'use client';

import KPICard from '@/components/ui/KPICard';
import { Users, User, Calendar, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const kpiData = [
    {
      icon: Users,
      title: 'Total Clients',
      value: '10',
      change: '12%',
      changeType: 'positive',
    },
    {
      icon: User,
      title: 'Active Staff',
      value: '5',
      change: '3%',
      changeType: 'positive',
    },
    {
      icon: Calendar,
      title: 'Scheduled Visits Today',
      value: '8',
      change: '2%',
      changeType: 'negative',
    },
    {
      icon: DollarSign,
      title: 'Revenue This Month',
      value: '$12,450',
      change: '8%',
      changeType: 'positive',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Welcome back! Here's what's happening with your clients today.
        </p>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            icon={kpi.icon}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changeType={kpi.changeType}
          />
        ))}
      </div>

      {/* Placeholder for Phase 2 Content */}
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '48px 24px',
        }}
      >
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px' }}>
          More features coming soon!
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          This is the Phase 1 dashboard placeholder. Phase 2 will include:
          <br />
          • Today's schedule and visits
          • Recent activity feed
          • Quick action buttons
          • Analytics charts and graphs
        </p>
      </div>
    </div>
  );
}
