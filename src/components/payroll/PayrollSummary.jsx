'use client';

import { useEffect, useState } from 'react';
import KPICard from '@/components/ui/KPICard';
import { Clock, CheckCircle, FileText, Calendar } from 'lucide-react';

export default function PayrollSummary() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/payroll/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching payroll stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card" style={{ height: '120px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <KPICard
        icon={FileText}
        title="Total Timesheets"
        value={stats?.totalTimesheets || 0}
        changeType="neutral"
      />
      <KPICard
        icon={CheckCircle}
        title="Pending Approval"
        value={stats?.pendingApproval || 0}
        changeType={stats?.pendingApproval > 0 ? 'warning' : 'neutral'}
      />
      <KPICard
        icon={Calendar}
        title="Approved This Week"
        value={stats?.approvedThisWeek || 0}
        changeType="positive"
      />
      <KPICard
        icon={Clock}
        title="Total Hours This Week"
        value={`${stats?.totalHours || 0} hrs`}
        changeType="neutral"
      />
    </div>
  );
}
