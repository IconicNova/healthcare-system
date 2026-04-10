'use client';

import { useEffect, useState } from 'react';
import NotificationItem from './NotificationItem';
import { CheckSquare, Trash2 } from 'lucide-react';

const tabs = ['all', 'unread', 'alerts', 'system'];
const categories = [
  { id: 'all', name: 'All' },
  { id: 'visit', name: 'Visit' },
  { id: 'certification', name: 'Certification' },
  { id: 'form', name: 'Form' },
  { id: 'billing', name: 'Billing' },
  { id: 'system', name: 'System' },
];

export default function NotificationList() {
  const [activeTab, setActiveTab] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, categoryFilter]);

  const fetchNotifications = async () => {
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
        pageSize: '50',
        category: categoryFilter,
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
  };

  const handleMarkAllRead = async () => {
    if (!confirm('Mark all notifications as read?')) return;

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications? This cannot be undone.')) return;

    try {
      for (const notification of notifications) {
        await fetch(`/api/notifications/${notification.id}`, {
          method: 'DELETE',
        });
      }
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const toggleSelection = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = async () => {
    try {
      for (const id of selectedIds) {
        await fetch(`/api/notifications/${id}/read`, {
          method: 'PATCH',
        });
      }
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected notifications?`)) return;

    try {
      for (const id of selectedIds) {
        await fetch(`/api/notifications/${id}`, {
          method: 'DELETE',
        });
      }
      setSelectedIds([]);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
    }
  };

  return (
    <div>
      {/* Tabs and Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {selectedIds.length > 0 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={handleBulkMarkRead}>
                <CheckSquare size={14} />
                Mark Read
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {(notifications.length > 0 || selectedIds.length > 0) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <button className="btn btn-ghost btn-sm" onClick={handleMarkAllRead}>
            Mark All as Read
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClearAll}>
            Clear All
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="card">
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : notifications.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {notifications.map(notification => (
                <div key={notification.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(notification.id)}
                    onChange={() => toggleSelection(notification.id)}
                    style={{ marginRight: '12px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <NotificationItem notification={notification} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p>No notifications found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
