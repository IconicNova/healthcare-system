'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { buildBreadcrumbItems } from '@/lib/breadcrumbs';
import { useBreadcrumbLabels } from './BreadcrumbLabelsContext';

export default function Breadcrumb() {
  const pathname = usePathname();
  const { labels } = useBreadcrumbLabels();
  const items = buildBreadcrumbItems(pathname, labels);

  if (items.length === 0) return null;

  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/dashboard" className="breadcrumb-item">
        <Home size={16} />
      </Link>
      {items.map((item) => (
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
