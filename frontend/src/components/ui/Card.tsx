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
