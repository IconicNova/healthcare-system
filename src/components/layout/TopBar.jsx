'use client';

import { useSession, signOut } from '@/lib/auth';
import { getInitials, getRoleDisplayName } from '@/lib/utils';
import { Search, Bell, Menu, LogOut } from 'lucide-react';
import { useState } from 'react';
import Breadcrumb from './Breadcrumb';

export default function TopBar({ title }) {
  const { data: session } = useSession();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
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
          <button className="topbar-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="topbar-badge">3</span>
          </button>

          {/* User Dropdown */}
          <div className="dropdown" style={{ display: 'inline-block' }}>
            <button
              className="topbar-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              style={{
                width: 'auto',
                padding: '8px 12px',
                gap: '8px',
              }}
            >
              <div className="avatar avatar-sm">
                {getInitials(session?.user?.firstName || '', session?.user?.lastName || '')}
              </div>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {session?.user?.firstName}
              </span>
            </button>

            {showUserDropdown && (
              <div className="dropdown-menu" style={{ top: '100%', marginTop: '8px' }}>
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
