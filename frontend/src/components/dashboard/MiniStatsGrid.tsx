import React from 'react';
import Link from 'next/link';
import { MiniStatsSkeleton } from '../ui/Skeleton';
import styles from './MiniStatsGrid.module.css';
import { formatNumber } from '../../lib/format';

export interface MiniStatsGridProps {
  stats: {
    finances?: {
      totalInvested?: number;
      totalReturns?: number;
      netProfitLoss?: number;
      collectionRate?: number;
      totalPendingDues?: number;
    };
  } | null;
  isLoading?: boolean;
  className?: string;
}

export const MiniStatsGrid: React.FC<MiniStatsGridProps> = ({ stats, isLoading = false, className = '' }) => {
  if (isLoading || !stats) {
    return <MiniStatsSkeleton className={className} />;
  }

  const finances = stats?.finances;
  const netPnl = finances?.netProfitLoss || 0;
  const isProfitable = netPnl >= 0;

  return (
    <div className={`mini-stats-grid ${className}`.trim()}>
      {/* Box 1: Total Invested (opens the itemised list of payments) */}
      <Link href="/invested" className="mini-stat-card mini-stat-link" title="See every payment">
        <div className={`mini-stat-icon-wrap ${styles.blueIcon}`}>
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Total Invested</span>
          <span className="mini-stat-val">Rs. {formatNumber(finances?.totalInvested)}</span>
          <span className="mini-stat-sub">Match Costs + Advances + Expenses</span>
        </div>
      </Link>

      {/* Box 2: Total Returns (opens the itemised list of income) */}
      <Link href="/returns" className="mini-stat-card mini-stat-link" title="See every return">
        <div className={`mini-stat-icon-wrap ${styles.greenIcon}`}>
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Total Returns</span>
          <span className={`mini-stat-val ${styles.greenValue}`}>
            Rs. {formatNumber(finances?.totalReturns)}
          </span>
          <span className="mini-stat-sub">Sponsors + Prizes + Player Fees − Refunds</span>
        </div>
      </Link>

      {/* Box 3: Net Profit / Loss (opens the profit & loss ledger) */}
      <Link href="/profit-loss" className="mini-stat-card mini-stat-link" title="See profit & loss">
        <div
          className={`mini-stat-icon-wrap ${
            isProfitable ? styles.amberIcon : styles.roseIcon
          }`}
        >
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Net Profit / Loss</span>
          <span
            className={`mini-stat-val ${
              isProfitable ? styles.amberValue : styles.roseValue
            }`}
          >
            Rs. {formatNumber(netPnl)}
          </span>
          <span className="mini-stat-sub">
            {isProfitable ? '+ Profitable Season' : '- Net Deficit'}
          </span>
        </div>
      </Link>

      {/* Box 4: Player Fee Collection */}
      <div className="mini-stat-card">
        <div className={`mini-stat-icon-wrap ${styles.purpleIcon}`}>
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Player Fee Collection</span>
          <span className={`mini-stat-val ${styles.purpleValue}`}>
            {finances?.collectionRate || 0}%
          </span>
          <span className="mini-stat-sub">
            Pending: Rs. {formatNumber(finances?.totalPendingDues)}
          </span>
        </div>
      </div>
    </div>
  );
};
