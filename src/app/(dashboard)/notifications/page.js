'use client';

import { Bell } from 'lucide-react';
import NotificationList from '@/components/notifications/NotificationList';

export default function NotificationsPage() {
  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Bell size={28} color="var(--color-primary)" />
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              Notifications
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              Stay updated with your home care activities
            </p>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <NotificationList />
    </div>
  );
}
