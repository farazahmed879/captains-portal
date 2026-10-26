import React from 'react';

export type CardVariant = 'emerald' | 'blue' | 'amber' | 'purple' | 'rose' | 'navy' | 'default';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  variant?: CardVariant;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  elevated = false,
  variant = 'default',
  hoverable = true,
  className = '',
  children,
  style,
  ...props
}) => {
  const variantClass = variant !== 'default' ? `card-theme-${variant}` : '';
  const hoverClass = hoverable ? 'card-hoverable' : '';
  const elevatedClass = elevated ? 'card-elevated' : '';

  return (
    <div
      className={`card ${elevatedClass} ${variantClass} ${hoverClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '14px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <h3
      className={className}
      style={{
        fontSize: '18px',
        fontWeight: 800,
        color: 'var(--text-primary)',
        margin: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardSubtitle: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <p
      className={className}
      style={{
        fontSize: '12px',
        color: 'var(--text-secondary)',
        marginTop: '2px',
        ...style,
      }}
      {...props}
    >
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div className={className} style={{ ...style }} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  style,
  ...props
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)',
        marginTop: '14px',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface SubCardProps extends React.HTMLAttributes<HTMLDivElement> {
  dimmed?: boolean;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg' | string;
  borderRadius?: string;
  borderLeftColor?: string;
}

export const SubCard: React.FC<SubCardProps> = ({
  dimmed = true,
  hoverable = false,
  padding = 'md',
  borderRadius = '10px',
  borderLeftColor,
  className = '',
  style,
  onClick,
  children,
  ...props
}) => {
  const paddingMap = {
    sm: '8px 12px',
    md: '10px 12px',
    lg: '12px 14px',
  };
  const resolvedPadding =
    typeof padding === 'string' && padding in paddingMap
      ? paddingMap[padding as keyof typeof paddingMap]
      : padding;

  return (
    <div
      className={`sub-card ${dimmed ? 'dimmed' : ''} ${
        hoverable || onClick ? 'clickable' : ''
      } ${className}`.trim()}
      onClick={onClick}
      style={{
        padding: resolvedPadding,
        borderRadius,
        borderLeft: borderLeftColor ? `4px solid ${borderLeftColor}` : undefined,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface KpiCellProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  value: React.ReactNode;
  valueColor?: string;
  dimmed?: boolean;
  background?: string;
}

export const KpiCell: React.FC<KpiCellProps> = ({
  label,
  value,
  valueColor,
  dimmed = false,
  background,
  className = '',
  style,
  children,
  ...props
}) => {
  return (
    <div
      className={`widget-kpi-cell ${dimmed ? 'dimmed' : ''} ${className}`.trim()}
      style={{
        background: background,
        ...style,
      }}
      {...props}
    >
      <div className="widget-kpi-label">{label}</div>
      <div className="widget-kpi-val" style={{ color: valueColor }}>
        {value}
      </div>
      {children}
    </div>
  );
};

