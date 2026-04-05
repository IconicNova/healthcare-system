'use client';

import { useEffect, useState } from 'react';
import { Bell, Clock, FileText, Calendar, AlertCircle } from 'lucide-react';

export default function AlertsPanel() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await fetch('/api/dashboard/alerts');
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts);
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAlerts();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'visit':
        return Calendar;
      case 'invoice':
        return FileText;
      case 'warning':
        return AlertCircle;
      default:
        return Bell;
    }
  };

  const getIconColor = (type) => {
    switch (type) {
      case 'visit':
        return 'var(--color-primary)';
      case 'invoice':
        return 'var(--color-warning)';
      case 'warning':
        return 'var(--color-error)';
      default:
        return 'var(--color-text-secondary)';
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '16px' }}>
            Alerts
          </h3>
          <div style={{ height: '200px', backgroundColor: '#f3f4f6', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
            Alerts
          </h3>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            {alerts.length} unread
          </div>
        </div>

        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Bell size={32} color="var(--color-border)" style={{ marginBottom: '8px' }} />
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0 }}>
              No alerts
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {alerts.map((alert) => {
              const Icon = getIcon(alert.type);
              return (
                <div
                  key={alert.id}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-background-secondary)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: `${getIconColor(alert.type)}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} color={getIconColor(alert.type)} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>
                      {alert.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      {alert.message}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      {alert.createdAt}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
