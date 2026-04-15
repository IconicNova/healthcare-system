'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

const tabs = [
  { id: 'all', name: 'All' },
  { id: 'unread', name: 'Unread' },
  { id: 'alerts', name: 'Alerts' },
  { id: 'system', name: 'System' },
];

export default function NotificationDropdown() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const dropdownRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/unread-count');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let readFilter = null;
      let typeFilter = null;

      if (activeTab === 'unread') {
        readFilter = false;
      } else if (activeTab === 'alerts') {
        typeFilter = 'alert';
      } else if (activeTab === 'system') {
        typeFilter = 'system';
      }

      const params = new URLSearchParams({
        pageSize: '20',
      });

      if (readFilter !== null) {
        params.append('read', readFilter.toString());
      }
      if (typeFilter !== null) {
        params.append('type', typeFilter);
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [fetchNotifications, isOpen]);

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      setUnreadCount(0);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveTab('all');
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        className="topbar-btn"
        aria-label="Notifications"
        onClick={toggleDropdown}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="topbar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            marginTop: '8px',
            right: 0,
            minWidth: '380px',
            maxHeight: '500px',
            overflow: 'hidden',
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            zIndex: 9999,
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
            <button
              className="btn btn-ghost"
              style={{ padding: '4px' }}
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div
            className="tabs"
            style={{
              display: 'flex',
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border)',
              gap: '4px',
              flexWrap: 'wrap',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  fontSize: '12px',
                  padding: '6px 10px',
                  textTransform: 'capitalize',
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 16px',
              borderBottom: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-gray-50)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </span>
            {unreadCount > 0 && (
              <button
                className="btn btn-ghost"
                style={{ fontSize: '11px', padding: '4px 8px' }}
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
            <Link href="/notifications" onClick={() => setIsOpen(false)} style={{ color: 'var(--color-accent)', fontSize: '13px' }}>
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
