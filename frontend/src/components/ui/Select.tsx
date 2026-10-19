import React, { forwardRef } from 'react';

export interface SelectOption {
  label: string;
  value: string | number;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, children, className = '', id, style, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="form-group" style={{ marginBottom: '14px' }}>
        {label && (
          <label
            htmlFor={selectId}
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

        <select
          ref={ref}
          id={selectId}
          className={`form-select ${className}`.trim()}
          style={{
            borderColor: error ? 'var(--accent-rose)' : undefined,
            ...style,
          }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>

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

Select.displayName = 'Select';
