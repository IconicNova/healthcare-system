'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications?read=false&pageSize=5');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      setUnreadCount(0);
      setNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="topbar-btn"
        aria-label="Notifications"
        onClick={() => fetchNotifications()}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Dropdown */}
      <div
        className="dropdown-menu"
        style={{
          top: '100%',
          marginTop: '8px',
          right: 0,
          left: 'auto',
          minWidth: '350px',
          maxHeight: '400px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-gray-50)',
          }}
        >
          <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Notifications</span>
          {unreadCount > 0 && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: '12px', padding: '4px 8px' }}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </button>
          )}
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div className="loading-spinner sm" style={{ margin: '0 auto' }} />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact={true}
              />
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
              No notifications
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px',
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-gray-50)',
            textAlign: 'center',
          }}
        >
          <Link href="/notifications" style={{ color: 'var(--color-accent)', fontSize: '13px' }}>
            View all notifications →
          </Link>
        </div>
      </div>
    </div>
  );
}
