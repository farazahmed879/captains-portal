import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  isIconOnly?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  isIconOnly = false,
  children,
  className = '',
  disabled,
  style,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'danger':
        return 'btn-danger';
      case 'success':
        return 'btn-success';
      case 'outline':
      case 'secondary':
      default:
        return 'btn-secondary';
    }
  };

  const getSizeClass = () => {
    if (size === 'sm') return 'btn-sm';
    return '';
  };

  const iconOnlyClass = isIconOnly ? 'btn-icon' : '';

  return (
    <button
      className={`btn ${getVariantClass()} ${getSizeClass()} ${iconOnlyClass} ${className}`.trim()}
      disabled={disabled || loading}
      style={{
        opacity: disabled || loading ? 0.6 : 1,
        pointerEvents: disabled || loading ? 'none' : 'auto',
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <span
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
            display: 'inline-block',
          }}
        />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
      )}
      {!isIconOnly && children}
      {!loading && iconRight && (
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>{iconRight}</span>
      )}
    </button>
  );
};
