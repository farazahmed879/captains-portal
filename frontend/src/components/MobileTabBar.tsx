'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, isNavActive } from '../constants';

/** Bottom navigation shown only on phones (CSS hides it above 640px, where the Dock is used). */
export const MobileTabBar: React.FC = () => {
  const pathname = usePathname() || '/';
  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav className="mobile-tabbar" aria-label="Main">
      {NAV_ITEMS.map(({ shortLabel, href, icon: Icon }) => {
        const active = isNavActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={`mobile-tab ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
};
