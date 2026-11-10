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
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
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
      {children}
    </span>
  );
};
