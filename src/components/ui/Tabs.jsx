'use client';

import { useState } from 'react';

export default function Tabs({ tabs, defaultTab }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.value);

  return (
    <>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            className={`tab ${activeTab === tab.value ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
            onClick={() => !tab.disabled && setActiveTab(tab.value)}
            disabled={tab.disabled}
          >
            {tab.icon && <tab.icon size={16} style={{ marginRight: '8px' }} />}
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.find((tab) => tab.value === activeTab)?.content}
    </>
  );
}
