import React, { forwardRef } from 'react';

export interface AuthCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  containerStyle?: React.CSSProperties;
}

export const AuthCheckbox = forwardRef<HTMLInputElement, AuthCheckboxProps>(
  ({ label, containerStyle, className = '', ...props }, ref) => {
    return (
      <div className="auth-remember-row" style={containerStyle}>
        <label className="auth-checkbox-label">
          <input ref={ref} type="checkbox" className={className} {...props} />
          <span>{label}</span>
        </label>
      </div>
    );
  }
);

AuthCheckbox.displayName = 'AuthCheckbox';
