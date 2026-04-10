'use client';

import { useState } from 'react';

export default function Tabs({ tabs, defaultTab, activeTab, onTabChange }) {
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id || tabs[0]?.value);

  // Use controlled mode if activeTab prop is provided, otherwise use internal state
  const currentActiveTab = activeTab !== undefined ? activeTab : internalActiveTab;

  const handleTabChange = (tabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  return (
    <>
      <div className="tabs">
        {tabs.map((tab) => {
          const tabId = tab.id || tab.value;
          return (
            <button
              key={tabId}
              className={`tab ${currentActiveTab === tabId ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && handleTabChange(tabId)}
              disabled={tab.disabled}
            >
              {tab.icon && <tab.icon size={16} style={{ marginRight: '8px' }} />}
              {tab.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
