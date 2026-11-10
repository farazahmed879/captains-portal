import type React from 'react';
import type { IconProps } from '../components/icons';
import {
  DashboardIcon,
  ShieldAlertIcon,
  PlayersIcon,
  TrophyIcon,
  SwordsIcon,
  ReceiptIcon,
  SponsorIcon,
} from '../components/icons';

export interface NavItem {
  /** Full label (desktop Dock tooltip). */
  label: string;
  /** Short label for the phone tab bar. */
  shortLabel: string;
  href: string;
  icon: React.ComponentType<IconProps>;
}

/** Main sections of the app, used by both the desktop Dock and the phone tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', shortLabel: 'Home', href: '/', icon: DashboardIcon },
  { label: 'Teams', shortLabel: 'Teams', href: '/teams', icon: ShieldAlertIcon },
  { label: 'Players', shortLabel: 'Players', href: '/players', icon: PlayersIcon },
  { label: 'Tournaments', shortLabel: 'Tourneys', href: '/tournaments', icon: TrophyIcon },
  { label: 'Matches', shortLabel: 'Matches', href: '/matches', icon: SwordsIcon },
  { label: 'Expenses', shortLabel: 'Expenses', href: '/finances', icon: ReceiptIcon },
  { label: 'Sponsors & ROI', shortLabel: 'Sponsors', href: '/sponsors', icon: SponsorIcon },
];

/** True when `pathname` belongs to the section at `href`. */
export const isNavActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
