import React from 'react';
import {
  DollarIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
} from '../icons';
import { formatCurrency } from './types';
import { MiniStatsSkeleton } from '../ui/Skeleton';
import styles from './MiniStatsGrid.module.css';

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
      {/* Box 1: Total Invested */}
      <div className="mini-stat-card">
        <div className={`mini-stat-icon-wrap ${styles.blueIcon}`}>
          <DollarIcon size={18} />
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Total Invested</span>
          <span className="mini-stat-val">Rs. {formatCurrency(finances?.totalInvested)}</span>
          <span className="mini-stat-sub">Entry Fees + Expenses</span>
        </div>
      </div>

      {/* Box 2: Total Returns */}
      <div className="mini-stat-card">
        <div className={`mini-stat-icon-wrap ${styles.greenIcon}`}>
          <TrendingUpIcon size={18} />
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Total Returns</span>
          <span className={`mini-stat-val ${styles.greenValue}`}>
            Rs. {formatCurrency(finances?.totalReturns)}
          </span>
          <span className="mini-stat-sub">Sponsors + Winning Prizes</span>
        </div>
      </div>

      {/* Box 3: Net ROI / Profit */}
      <div className="mini-stat-card">
        <div
          className={`mini-stat-icon-wrap ${
            isProfitable ? styles.amberIcon : styles.roseIcon
          }`}
        >
          <TrophyIcon size={18} />
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Net Profit / Loss</span>
          <span
            className={`mini-stat-val ${
              isProfitable ? styles.amberValue : styles.roseValue
            }`}
          >
            Rs. {formatCurrency(netPnl)}
          </span>
          <span className="mini-stat-sub">
            {isProfitable ? '+ Profitable Season' : '- Net Deficit'}
          </span>
        </div>
      </div>

      {/* Box 4: Player Fee Collection */}
      <div className="mini-stat-card">
        <div className={`mini-stat-icon-wrap ${styles.purpleIcon}`}>
          <UsersIcon size={18} />
        </div>
        <div className="mini-stat-info">
          <span className="mini-stat-label">Player Fee Collection</span>
          <span className={`mini-stat-val ${styles.purpleValue}`}>
            {finances?.collectionRate || 0}%
          </span>
          <span className="mini-stat-sub">
            Pending: Rs. {formatCurrency(finances?.totalPendingDues)}
          </span>
        </div>
      </div>
    </div>
  );
};
