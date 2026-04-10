'use client';

import { useSession, signOut } from '@/lib/auth';
import { getInitials, getRoleDisplayName } from '@/lib/utils';
import { Search, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import Breadcrumb from './Breadcrumb';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export default function TopBar({ onMenuClick }) {
  const { data: session } = useSession();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Mobile Menu Button */}
        <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle menu">
          <Menu size={20} />
        </button>

        {/* Breadcrumb */}
        <Breadcrumb />
      </div>

      <div className="topbar-right">
        {/* Search */}
        <div className="topbar-search">
          <Search className="topbar-search-icon" />
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Notifications */}
          <NotificationDropdown />

          {/* User Dropdown */}
          <div className="dropdown">
            <button
              className="topbar-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                width: 'auto',
                padding: '8px 12px',
                gap: '8px',
              }}
              aria-label="User menu"
            >
              <div className="avatar avatar-sm">
                {getInitials(session?.user?.firstName || '', session?.user?.lastName || '')}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {session?.user?.firstName}
              </span>
            </button>

            {showUserDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">Account</div>
                <div className="dropdown-item" style={{ justifyContent: 'space-between' }}>
                  <span>{session?.user?.email}</span>
                </div>
                <div className="dropdown-item" style={{ justifyContent: 'space-between' }}>
                  <span>{getRoleDisplayName(session?.user?.role)}</span>
                </div>
                <div className="dropdown-divider" />
                <button
                  className="dropdown-item dropdown-item-danger"
                  onClick={() => {
                    setShowUserDropdown(false);
                    handleSignOut();
                  }}
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
