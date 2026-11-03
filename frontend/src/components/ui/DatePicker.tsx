import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { CalendarIcon } from '../icons';
import { formatDate } from '../../lib/format';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className = '', id, style, value, defaultValue, onChange, onFocus, onBlur, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const innerRef = useRef<HTMLInputElement | null>(null);
    const [internalValue, setInternalValue] = useState<string>(
      typeof value === 'string'
        ? value
        : typeof defaultValue === 'string'
        ? defaultValue
        : ''
    );
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value || ''));
      } else if (innerRef.current && innerRef.current.value !== internalValue) {
        setInternalValue(innerRef.current.value);
      }
    }, [value]);

    const setMergedRef = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
      if (node && value === undefined && node.value && node.value !== internalValue) {
        setInternalValue(node.value);
      }
    };

    const activeDateStr = value !== undefined ? String(value || '') : internalValue;
    const formattedDisplay = activeDateStr ? formatDate(activeDateStr, '') : '';

    return (
      <div className="form-group">
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
          {/* Formatted Display Layer */}
          <div
            className={`form-input ${className}`.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingLeft: '36px',
              paddingRight: '12px',
              minHeight: '41px',
              borderColor: error ? 'var(--accent-rose)' : isFocused ? '#0284c7' : undefined,
              boxShadow: isFocused ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : undefined,
              color: formattedDisplay ? 'var(--text-primary)' : 'var(--text-muted)',
              userSelect: 'none',
              ...style,
            }}
          >
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

            <span style={{ fontWeight: formattedDisplay ? 500 : 400 }}>
              {formattedDisplay || props.placeholder || 'Select date...'}
            </span>

            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            >
              <CalendarIcon size={14} />
            </span>
          </div>

          {/* Native Date Input Overlay for Calendar Picker & Form Binding */}
          <input
            ref={setMergedRef}
            id={inputId}
            type="date"
            value={value}
            defaultValue={defaultValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              onChange?.(e);
            }}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            onClick={(e) => {
              try {
                (e.currentTarget as any).showPicker?.();
              } catch {
                // Ignore if showPicker is unsupported or already open
              }
              props.onClick?.(e);
            }}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: props.disabled ? 'not-allowed' : 'pointer',
              zIndex: 2,
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
