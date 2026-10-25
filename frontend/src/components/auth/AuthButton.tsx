import React from 'react';

export interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const AuthButton: React.FC<AuthButtonProps> = ({
  children,
  isLoading = false,
  loadingText = 'Please wait...',
  iconLeft,
  iconRight,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      className={`auth-primary-btn ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span>{loadingText}</span>
      ) : (
        <>
          {iconLeft}
          <span>{children}</span>
          {iconRight}
        </>
      )}
    </button>
  );
};
