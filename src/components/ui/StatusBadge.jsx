import { getStatusColor } from '@/lib/utils';

export default function StatusBadge({ status, children }) {
  const colorClass = status
    ? `badge-${getStatusColor(status)}`
    : 'badge-gray';

  return (
    <span className={`badge ${colorClass}`}>
      {children || status}
    </span>
  );
}
