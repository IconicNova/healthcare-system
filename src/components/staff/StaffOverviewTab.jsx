'use client';

import { useState, useEffect } from 'react';
import KPICard from '@/components/ui/KPICard';
import { Calendar, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { calculateStaffOverviewMetrics } from '@/lib/clients-staff-review.mjs';

export default function StaffOverviewTab({ staffData }) {
  const [metrics, setMetrics] = useState({
    totalVisits: 0,
    visitsThisMonth: 0,
    avgDuration: 0,
    punctualityRate: null,
  });
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!staffData?.id) return;

    const fetchData = async () => {
      try {
        // Fetch visits for metrics calculation
        const visitsResponse = await fetch(`/api/staff/${staffData.id}/visits`);
        if (visitsResponse.ok) {
          const visits = await visitsResponse.json();
          const nextMetrics = calculateStaffOverviewMetrics(visits, new Date());
          setMetrics(nextMetrics);

          // Get upcoming visits
          const now = new Date();
          const upcoming = visits
            .filter(v => new Date(v.startTime) > now && v.status !== 'CANCELLED')
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, 5);
          setUpcomingVisits(upcoming);
        }
      } catch (error) {
        console.error('Error fetching staff metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [staffData]);

  const kpiCards = [
    {
      title: 'Total Visits',
      value: metrics.totalVisits,
      icon: Calendar,
      color: '#3B82F6',
      description: 'All-time completed visits',
    },
    {
      title: 'Visits This Month',
      value: metrics.visitsThisMonth,
      icon: TrendingUp,
      color: '#10B981',
      description: 'Current month activity',
    },
    {
      title: 'Avg Duration',
      value: `${metrics.avgDuration} min`,
      icon: Clock,
      color: '#F59E0B',
      description: 'Average visit length',
    },
    {
      title: 'Punctuality Rate',
      value: metrics.punctualityRate === null ? 'N/A' : `${metrics.punctualityRate}%`,
      icon: CheckCircle,
      color: '#8B5CF6',
      description: 'On-time arrivals',
    },
  ];

  return (
    <div>
      {/* Performance Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        {kpiCards.map((card, index) => (
          <KPICard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            description={card.description}
          />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Upcoming Visits */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Visits</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>Loading...</div>
            ) : upcomingVisits.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                No upcoming visits scheduled
              </div>
            ) : (
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Date & Time</th>
                    <th>Client</th>
                    <th style={{ width: '100px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingVisits.map(visit => (
                    <tr key={visit.id}>
                      <td>
                        <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                          {new Date(visit.startTime).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                          {new Date(visit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(visit.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--color-text)' }}>
                        {visit.client ? `${visit.client.firstName} ${visit.client.lastName}` : 'N/A'}
                      </td>
                      <td>
                        <span className={`badge badge-${visit.status === 'SCHEDULED' ? 'info' : 'gray'}`}>
                          {visit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
              Recent activity will appear here after this staff member completes visits, updates availability, or renews certifications.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
