'use client';

import Tabs from '@/components/ui/Tabs';
import { CARE_DELIVERY_TABS } from '@/components/care-delivery/care-delivery.helpers';

export default function CareDeliveryLayout({ children, activeTab = 'tasks', onTabChange }) {
  return (
    <div>
      <Tabs tabs={CARE_DELIVERY_TABS} activeTab={activeTab} onTabChange={onTabChange} />
      <div style={{ marginTop: '24px' }}>
        {children}
      </div>
    </div>
  );
}
