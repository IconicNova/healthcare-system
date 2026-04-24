'use client';

import { useEffect, useState } from 'react';
import KPICard from '@/components/ui/KPICard';
import { Users, User, Calendar, DollarSign } from 'lucide-react';

export default function MetricsGrid({ metrics: initialMetrics = null }) {
  const [loading, setLoading] = useState(!initialMetrics);
  const [metrics, setMetrics] = useState({
    totalClients: { value: '-', change: '0%', changeType: 'neutral' },
    activeStaff: { value: '-', change: '0%', changeType: 'neutral' },
    scheduledVisitsToday: { value: '-', change: '0%', changeType: 'neutral' },
    revenueThisMonth: { value: '-', change: '0%', changeType: 'neutral' },
  });

  useEffect(() => {
    if (initialMetrics) {
      setMetrics(initialMetrics);
      setLoading(false);
      return;
    }

    async function fetchMetrics() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMetrics();
  }, [initialMetrics]);

  const kpiConfig = [
    {
      key: 'totalClients',
      icon: Users,
      title: 'Total Clients',
    },
    {
      key: 'activeStaff',
      icon: User,
      title: 'Active Staff',
    },
    {
      key: 'scheduledVisitsToday',
      icon: Calendar,
      title: 'Scheduled Visits Today',
    },
    {
      key: 'revenueThisMonth',
      icon: DollarSign,
      title: 'Revenue This Month',
    },
  ];

  if (loading) {
    return (
      <div className="dashboard-kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card" style={{ minHeight: '100px' }}>
            <div className="card-body">
              <div style={{ height: '48px', backgroundColor: '#e5e7eb', borderRadius: '12px', marginBottom: '12px' }} />
              <div style={{ height: '14px', backgroundColor: '#e5e7eb', width: '60%', marginBottom: '8px' }} />
              <div style={{ height: '28px', backgroundColor: '#e5e7eb', width: '80%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="dashboard-kpi-grid">
      {kpiConfig.map(({ key, icon: Icon, title }) => (
        <KPICard
          key={key}
          icon={Icon}
          title={title}
          value={metrics[key]?.value}
          change={metrics[key]?.change}
          changeType={metrics[key]?.changeType}
        />
      ))}
    </div>
  );
}
