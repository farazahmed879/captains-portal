'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DashboardIcon,
  ShieldAlertIcon,
  PlayersIcon,
  TrophyIcon,
  SwordsIcon,
  ReceiptIcon,
  SponsorIcon,
} from './icons';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: DashboardIcon },
    { name: 'My Teams', href: '/teams', icon: ShieldAlertIcon },
    { name: 'Players & Ledger', href: '/players', icon: PlayersIcon },
    { name: 'Tournaments', href: '/tournaments', icon: TrophyIcon },
    { name: 'Matches & Fees', href: '/matches', icon: SwordsIcon },
    { name: 'Expenses', href: '/finances', icon: ReceiptIcon },
    { name: 'Sponsors & ROI', href: '/sponsors', icon: SponsorIcon },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">CP</div>
        <div>
          <div className="brand-title">CAPTAINS</div>
          <div className="brand-subtitle">Sports Pro Portal</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <ul className="nav-list">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <IconComponent size={18} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #1e293b' }}>
          <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginBottom: '4px' }}>
              Logged in as
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>Super Admin</div>
            <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 500 }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></span>
              Database Connected
            </div>
          </div>
        </div>
      </nav>
    </aside>
  );
};
