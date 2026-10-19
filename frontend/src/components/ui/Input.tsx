import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, iconRight, className = '', id, style, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group" style={{ marginBottom: '14px' }}>
        {label && (
          <label
            htmlFor={inputId}
            className="form-label"
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '6px',
            }}
          >
            {label}
            {props.required && <span style={{ color: 'var(--accent-rose)', marginLeft: '4px' }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`form-input ${className}`.trim()}
            style={{
              paddingLeft: icon ? '36px' : '12px',
              paddingRight: iconRight ? '36px' : '12px',
              borderColor: error ? 'var(--accent-rose)' : undefined,
              ...style,
            }}
            {...props}
          />

          {iconRight && (
            <span
              style={{
                position: 'absolute',
                right: '12px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
              }}
            >
              {iconRight}
            </span>
          )}
        </div>

        {error && (
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--accent-rose)', marginTop: '4px' }}>
            {error}
          </span>
        )}

        {!error && helperText && (
          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
