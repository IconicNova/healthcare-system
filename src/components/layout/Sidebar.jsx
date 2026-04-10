'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from '@/lib/auth';
import { getInitials, getRoleDisplayName } from '@/lib/utils';
import {
  Home,
  Users,
  User,
  Calendar,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
  Wallet,
  Clock,
  PieChart,
  Bell
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Staff', href: '/staff', icon: User },
  { name: 'Care Delivery', href: '/care-delivery', icon: ClipboardCheck },
  { name: 'Scheduling', href: '/scheduling', icon: Calendar },
  { name: 'Care Plans', href: '/care-plans', icon: ClipboardList },
  { name: 'Billing', href: '/billing', icon: Wallet },
  { name: 'Payroll', href: '/payroll', icon: Clock },
  { name: 'Reports', href: '/reports', icon: PieChart },
  { name: 'Notifications', href: '/notifications', icon: Bell },
];

const settings = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirectTo: '/login' });
  };

  return (
    <>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>HC</span>
            </div>
            {!collapsed && <span>HomeCare Pro</span>}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="sidebar-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              {!collapsed && 'Main Menu'}
            </div>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href} passHref>
                  <button
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    data-tooltip={collapsed ? item.name : undefined}
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                      }
                    }}
                  >
                    <item.icon className="sidebar-item-icon" />
                    {!collapsed && <span>{item.name}</span>}
                  </button>
                </Link>
              );
            })}
          </div>

          {!collapsed && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Other</div>
              {settings.map((item) => (
                <Link key={item.name} href={item.href} passHref>
                  <button className="sidebar-item">
                    <item.icon className="sidebar-item-icon" />
                    <span>{item.name}</span>
                  </button>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {getInitials(session?.user?.firstName || '', session?.user?.lastName || '')}
            </div>
            {!collapsed && (
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {session?.user?.firstName} {session?.user?.lastName}
                </div>
                <div className="sidebar-user-role">
                  {getRoleDisplayName(session?.user?.role)}
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="sidebar-item"
              style={{ marginTop: '8px' }}
            >
              <LogOut className="sidebar-item-icon" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
