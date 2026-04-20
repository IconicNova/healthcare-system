'use client';

import { useState } from 'react';

export default function Tabs({
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  variant = 'default',
  className = '',
}) {
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
      <div className={`tabs ${variant === 'compact' ? 'tabs-compact' : ''} ${className}`.trim()}>
        {tabs.map((tab) => {
          const tabId = tab.id || tab.value;
          const hasBadge = tab.badge !== undefined && tab.badge !== null && tab.badge !== '';
          return (
            <button
              type="button"
              key={tabId}
              role="tab"
              aria-selected={currentActiveTab === tabId}
              className={`tab ${variant === 'compact' ? 'tab-compact' : ''} ${currentActiveTab === tabId ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              onClick={() => !tab.disabled && handleTabChange(tabId)}
              disabled={tab.disabled}
            >
              {variant === 'compact' ? (
                <>
                  <span className="tab-stack">
                    <span className="tab-icon">
                      {tab.icon && <tab.icon size={18} />}
                    </span>
                    <span className="tab-label">{tab.label}</span>
                  </span>
                  {hasBadge && <span className="tab-count">{tab.badge}</span>}
                </>
              ) : (
                <>
                  {tab.icon && (
                    <span className="tab-icon">
                      <tab.icon size={16} />
                    </span>
                  )}
                  <span className="tab-label">{tab.label}</span>
                  {hasBadge && <span className="tab-count">{tab.badge}</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
