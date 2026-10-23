import React from 'react';

export type AlertVariant = 'danger' | 'success' | 'warning' | 'info';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  icon?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  icon,
  className = '',
  children,
  ...props
}) => (
  <div role="alert" className={`alert alert-${variant} ${className}`.trim()} {...props}>
    {icon && <span className="alert-icon">{icon}</span>}
    <span>{children}</span>
  </div>
);
