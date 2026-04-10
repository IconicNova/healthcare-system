'use client';

import { useEffect, useState } from 'react';
import KPICard from '@/components/ui/KPICard';
import { FileText, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function BillingSummary() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/billing/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
        }
      } catch (error) {
        console.error('Error fetching billing stats:', error);
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
        title="Total Invoices"
        value={stats?.totalInvoices || 0}
        change="30 days"
        changeType="neutral"
      />
      <KPICard
        icon={DollarSign}
        title="Pending Amount"
        value={formatCurrency(stats?.pendingAmount || 0)}
        changeType="neutral"
      />
      <KPICard
        icon={CheckCircle}
        title="Paid Amount"
        value={formatCurrency(stats?.paidAmount || 0)}
        changeType="positive"
      />
      <KPICard
        icon={AlertCircle}
        title="Overdue Invoices"
        value={stats?.overdueCount || 0}
        changeType={stats?.overdueCount > 0 ? 'negative' : 'neutral'}
      />
    </div>
  );
}
