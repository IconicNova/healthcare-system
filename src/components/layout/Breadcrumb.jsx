'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const routeLabels = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/staff': 'Staff',
  '/visits': 'Visits',
  '/care-plans': 'Care Plans',
  '/documents': 'Documents',
  '/invoices': 'Invoices',
  '/settings': 'Settings',
};

export default function Breadcrumb() {
  const pathname = usePathname();

  // Get path segments
  const segments = pathname.split('/').filter(Boolean);

  // Build breadcrumb items
  const items = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = routeLabels[path] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { path, label, isLast };
  });

  if (items.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/dashboard" className="breadcrumb-item">
        <Home size={16} />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={item.path}>
          {!item.isLast && <ChevronRight size={16} className="breadcrumb-separator" />}
          {item.isLast ? (
            <span className="breadcrumb-item active">{item.label}</span>
          ) : (
            <Link href={item.path} className="breadcrumb-item">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
