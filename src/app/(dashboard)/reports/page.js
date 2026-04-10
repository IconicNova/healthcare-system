'use client';

import { useState } from 'react';
import { PieChart, Users, FileText, ClipboardList, Shield } from 'lucide-react';
import FinancialReport from '@/components/reports/FinancialReport';
import StaffPerformance from '@/components/reports/StaffPerformance';
import ClientHistory from '@/components/reports/ClientHistory';
import VisitLogs from '@/components/reports/VisitLogs';
import ComplianceDashboard from '@/components/reports/ComplianceDashboard';

const tabs = [
  { id: 'financial', name: 'Financial', icon: PieChart },
  { id: 'staff', name: 'Staff Performance', icon: Users },
  { id: 'client', name: 'Client History', icon: FileText },
  { id: 'visits', name: 'Visit Logs', icon: ClipboardList },
  { id: 'compliance', name: 'Compliance', icon: Shield },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('financial');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'financial':
        return <FinancialReport />;
      case 'staff':
        return <StaffPerformance />;
      case 'client':
        return <ClientHistory />;
      case 'visits':
        return <VisitLogs />;
      case 'compliance':
        return <ComplianceDashboard />;
      default:
        return <FinancialReport />;
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
          Reports & Analytics
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
          Comprehensive reporting and data analysis for your home care organization
        </p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} style={{ marginRight: '8px' }} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ animation: 'fadeIn 0.3s ease' }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
