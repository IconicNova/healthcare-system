'use client';

import { Bell, Calendar, FileText, Shield, DollarSign, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
  alert: AlertCircle,
  visit: Calendar,
  form: FileText,
  certification: Shield,
  billing: DollarSign,
  system: Bell,
  default: Bell,
};

const categoryColors = {
  alert: '#ef4444',
  visit: '#3b82f6',
  form: '#f59e0b',
  certification: '#10b981',
  billing: '#8b5cf6',
  system: '#6b7280',
};

export default function NotificationItem({ notification, onClick, compact = false }) {
  const Icon = iconMap[notification.type] || iconMap.default;
  const categoryColor = categoryColors[notification.type] || categoryColors.default;
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  const handleNotificationClick = async () => {
    if (!notification.read) {
      try {
        await fetch(`/api/notifications/${notification.id}/read`, {
          method: 'PATCH',
        });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    if (onClick) {
      onClick(notification);
    }
  };

  return (
    <div
      className={`notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={handleNotificationClick}
    >
      <div className={`notification-icon ${notification.type}`}>
        <Icon size={18} />
      </div>
      <div className="notification-content">
        <div className={`notification-title ${!notification.read ? 'unread' : ''}`}>
          {notification.title}
        </div>
        <div className="notification-message">
          {notification.message}
        </div>
        <div className="notification-meta">
          {!compact && notification.read && (
            <span className="notification-dot" style={{ backgroundColor: '#94a3b8' }} />
          )}
          <span className="notification-time">{timeAgo}</span>
          {!compact && (
            <span
              className="badge"
              style={{
                backgroundColor: categoryColor + '20',
                color: categoryColor,
                fontSize: '10px',
                padding: '2px 6px',
              }}
            >
              {notification.type}
            </span>
          )}
        </div>
      </div>
      {!notification.read && !compact && (
        <div className="notification-dot" />
      )}
    </div>
  );
}
