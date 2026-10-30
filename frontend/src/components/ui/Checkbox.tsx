'use client';

import React, { forwardRef, useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';
import styles from './Checkbox.module.css';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      indeterminate = false,
      size = 'md',
      variant = 'primary',
      checked = false,
      disabled = false,
      className = '',
      style,
      id,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    useEffect(() => {
      if (inputRef && 'current' in inputRef && inputRef.current) {
        inputRef.current.indeterminate = Boolean(indeterminate);
      }
    }, [indeterminate, inputRef]);

    const isMarked = checked || indeterminate;

    // Size configuration for Lucide icons
    const iconSize = size === 'sm' ? 10 : size === 'lg' ? 15 : 12;

    const sizeClass =
      size === 'sm' ? styles.sizeSm : size === 'lg' ? styles.sizeLg : styles.sizeMd;

    const variantClass = isMarked
      ? variant === 'success'
        ? styles.successChecked
        : variant === 'warning'
        ? styles.warningChecked
        : variant === 'danger'
        ? styles.dangerChecked
        : styles.primaryChecked
      : '';

    const labelSizeClass =
      size === 'sm' ? styles.labelSm : size === 'lg' ? styles.labelLg : styles.labelMd;

    return (
      <label
        htmlFor={checkboxId}
        className={`${styles.wrapper} ${description ? styles.wrapperTop : styles.wrapperCenter} ${
          disabled ? styles.wrapperDisabled : styles.wrapperEnabled
        } ${className}`.trim()}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <span className={`${styles.boxWrap} ${sizeClass}`}>
          <input
            ref={inputRef}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className={styles.nativeInput}
            {...props}
          />

          <span className={`${styles.box} ${sizeClass} ${variantClass}`}>
            {indeterminate ? (
              <Minus
                size={iconSize}
                strokeWidth={3.2}
                color="#ffffff"
                strokeLinecap="round"
              />
            ) : checked ? (
              <Check
                size={iconSize}
                strokeWidth={3.2}
                color="#ffffff"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </span>
        </span>

        {(label || description) && (
          <span className={styles.labelCol}>
            {label && (
              <span
                className={`${styles.label} ${labelSizeClass} ${
                  disabled ? styles.labelDisabled : ''
                }`}
              >
                {label}
              </span>
            )}
            {description && (
              <span className={styles.description}>
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
