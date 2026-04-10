'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

export default function EVVWidget() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    verified: 0,
    unverified: 0,
    rate: 0,
  });

  useEffect(() => {
    fetchEVVData();
  }, []);

  const fetchEVVData = async () => {
    setLoading(true);
    try {
      const todayStart = format(startOfDay(new Date()), 'yyyy-MM-dd');
      const todayEnd = format(endOfDay(new Date()), 'yyyy-MM-dd');

      const response = await fetch(
        `/api/reports/visit-logs?dateFrom=${todayStart}&dateTo=${todayEnd}&pageSize=100`
      );

      if (response.ok) {
        const jsonData = await response.json();
        const visits = jsonData.visits || [];

        const verified = visits.filter(v => v.evvVerified).length;
        const unverified = visits.length - verified;
        const rate = visits.length > 0 ? Math.round((verified / visits.length) * 100) : 0;

        setData({ verified, unverified, rate });
      }
    } catch (error) {
      console.error('Error fetching EVV data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ minHeight: '120px' }}>
        <div className="card-body">
          <div style={{ height: '40px', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '12px' }} />
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, height: '60px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
            <div style={{ flex: 1, height: '60px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
            <div style={{ flex: 1, height: '60px', backgroundColor: '#e5e7eb', borderRadius: '8px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card evv-widget">
      <div className="evv-widget-header">
        <div className="evv-widget-icon">
          <MapPin size={24} />
        </div>
        <div>
          <h3 className="evv-widget-title">Visit Verification</h3>
          <p style={{ fontSize: '12px', opacity: 0.9 }}>Today&apos;s EVV Stats</p>
        </div>
      </div>

      <div className="evv-stats-grid">
        <div>
          <div className="evv-stat-value" style={{ color: '#7dd3fc' }}>{data.verified}</div>
          <div className="evv-stat-label">Verified</div>
        </div>
        <div>
          <div className="evv-stat-value" style={{ color: '#fca5a5' }}>{data.unverified}</div>
          <div className="evv-stat-label">Unverified</div>
        </div>
        <div>
          <div className="evv-stat-value" style={{ color: '#86efac' }}>{data.rate}%</div>
          <div className="evv-stat-label">Rate</div>
        </div>
      </div>
    </div>
  );
}
