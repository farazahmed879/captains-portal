import React, { forwardRef } from 'react';

export interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  (
    {
      label,
      error,
      icon,
      rightElement,
      id,
      className = '',
      containerClassName = '',
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);

    return (
      <div className={`auth-field ${containerClassName}`.trim()}>
        {label && (
          <label className="auth-label" htmlFor={inputId}>
            {label}
            {required && <span style={{ color: '#f87171', marginLeft: '3px' }}>*</span>}
          </label>
        )}

        <div className="auth-input-container">
          {icon && <span className="auth-input-icon">{icon}</span>}

          <input
            ref={ref}
            id={inputId}
            className={`auth-input ${className}`.trim()}
            style={{
              paddingLeft: icon ? '32px' : '10px',
              paddingRight: rightElement ? '34px' : '10px',
            }}
            {...props}
          />

          {rightElement}
        </div>

        {error && (
          <span className="auth-input-hint" style={{ color: '#f87171' }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
