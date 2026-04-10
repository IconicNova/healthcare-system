'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth';
import {
  Building2,
  Users,
  Settings,
  Clock,
  CreditCard,
  DollarSign,
  Bell
} from 'lucide-react';
import OrganizationSettings from '@/components/settings/OrganizationSettings';
import UsersAndRoles from '@/components/settings/UsersAndRoles';
import ServicesConfiguration from '@/components/settings/ServicesConfiguration';
import SchedulingRules from '@/components/settings/SchedulingRules';
import BillingSettings from '@/components/settings/BillingSettings';
import PayrollSettings from '@/components/settings/PayrollSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';

const sections = [
  { id: 'organization', name: 'Organization', icon: Building2 },
  { id: 'users', name: 'Users & Roles', icon: Users },
  { id: 'services', name: 'Services', icon: Settings },
  { id: 'scheduling', name: 'Scheduling Rules', icon: Clock },
  { id: 'billing', name: 'Billing', icon: CreditCard },
  { id: 'payroll', name: 'Payroll', icon: DollarSign },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeSection, setActiveSection] = useState('organization');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setIsAdmin(session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN');
    }
  }, [session]);

  // Check if user has permission to access settings
  if (!isAdmin) {
    return (
      <div className="empty-state">
        <Settings className="empty-state-icon" />
        <h3 className="empty-state-title">Access Denied</h3>
        <p className="empty-state-description">
          You don&apos;t have permission to access this page. Only administrators can view and modify settings.
        </p>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'organization':
        return <OrganizationSettings />;
      case 'users':
        return <UsersAndRoles />;
      case 'services':
        return <ServicesConfiguration />;
      case 'scheduling':
        return <SchedulingRules />;
      case 'billing':
        return <BillingSettings />;
      case 'payroll':
        return <PayrollSettings />;
      case 'notifications':
        return <NotificationSettings />;
      default:
        return <OrganizationSettings />;
    }
  };

  return (
    <div className="settings-container">
      {/* Sidebar Navigation */}
      <div className="settings-sidebar">
        <nav className="settings-nav">
          {sections.map(section => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon className="settings-nav-item-icon" />
                <span>{section.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            Settings
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Manage your organization settings and preferences
          </p>
        </div>

        {/* Section Content */}
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}
