import React from 'react';
import { Badge, BadgeProps } from './Badge';

export interface StatBadgeProps extends BadgeProps {
  label: string;
  value: React.ReactNode;
}

/** A Badge that pairs a small muted label with a bold value, e.g. "PAID  Rs. 3,000" */
export const StatBadge: React.FC<StatBadgeProps> = ({ label, value, className = '', ...props }) => (
  <Badge className={`stat-badge ${className}`.trim()} {...props}>
    <span className="stat-badge-label">{label}</span>
    <span className="stat-badge-value">{value}</span>
  </Badge>
);
