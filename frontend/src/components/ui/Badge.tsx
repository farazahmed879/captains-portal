import React from 'react';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warning'
  | 'primary'
  | 'purple'
  | 'secondary'
  | 'gold';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  icon,
  children,
  className = '',
  style,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'success':
        return 'badge-success';
      case 'danger':
        return 'badge-danger';
      case 'warning':
        return 'badge-warning';
      case 'primary':
        return 'badge-primary';
      case 'purple':
        return 'badge-purple';
      case 'gold':
        return 'badge-warning';
      case 'secondary':
      default:
        return 'badge-secondary';
    }
  };

  return (
    <span className={`badge ${getVariantClass()} ${className}`.trim()} style={style} {...props}>
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </span>
  );
};
