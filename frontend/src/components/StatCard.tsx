import React from 'react';

export type StatCardVariant = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'navy' | 'default';

interface TrendObj {
  text: string;
  positive?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  iconBg?: string;
  variant?: StatCardVariant;
  trend?: string | TrendObj;
  trendPositive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg,
  variant = 'default',
  trend,
  trendPositive,
  className = '',
  style,
}) => {
  const trendText = typeof trend === 'object' && trend ? trend.text : (trend as string);
  const isPositive = typeof trend === 'object' && trend ? (trend.positive ?? true) : trendPositive;

  const renderIcon = () => {
    if (React.isValidElement(icon)) return icon;
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && ('render' in icon || '$$typeof' in icon))
    ) {
      const IconComponent = icon as any;
      return <IconComponent size={20} />;
    }
    return null;
  };

  const variantClass = variant !== 'default' ? `card-theme-${variant}` : '';

  return (
    <div className={`card stat-card ${variantClass} ${className}`.trim()} style={style}>
      <div className="stat-header">
        <span className="stat-title">{title}</span>
        <div className="stat-icon" style={iconBg ? { background: iconBg } : undefined}>
          {renderIcon()}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-footer">
        {subtitle && <span className="stat-subtitle">{subtitle}</span>}
        {trendText && (
          <span className={`stat-trend-badge ${isPositive ? 'positive' : 'negative'}`}>
            <span className="trend-dot" />
            {trendText}
          </span>
        )}
      </div>
    </div>
  );
};

