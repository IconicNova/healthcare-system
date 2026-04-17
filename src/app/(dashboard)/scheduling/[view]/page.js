import { redirect } from 'next/navigation';

import SchedulingPageClient from '@/components/scheduling/SchedulingPageClient';
import { normalizeSchedulingViewSlug } from '@/lib/scheduling';

export default function SchedulingViewPage({ params, searchParams }) {
  const normalizedView = normalizeSchedulingViewSlug(params.view);

  if (normalizedView !== params.view) {
    const nextSearchParams = new URLSearchParams(searchParams);
    const query = nextSearchParams.toString();
    redirect(query ? `/scheduling/${normalizedView}?${query}` : `/scheduling/${normalizedView}`);
  }

  return <SchedulingPageClient viewSlug={normalizedView} />;
}
