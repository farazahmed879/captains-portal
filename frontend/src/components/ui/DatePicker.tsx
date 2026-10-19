import React, { forwardRef } from 'react';
import { CalendarIcon } from '../icons';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className = '', id, style, ...props }, ref) => {
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
            <CalendarIcon size={15} />
          </span>

          <input
            ref={ref}
            id={inputId}
            type="date"
            className={`form-input ${className}`.trim()}
            style={{
              paddingLeft: '36px',
              borderColor: error ? 'var(--accent-rose)' : undefined,
              ...style,
            }}
            {...props}
          />
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

DatePicker.displayName = 'DatePicker';
