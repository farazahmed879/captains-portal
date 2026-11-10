import React, { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDate } from '../../lib/format';
import { DATE_PICKER } from '../../constants';
import styles from './DatePicker.module.css';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

type View = 'days' | 'months' | 'years';
interface YMD {
  y: number;
  m: number; // 0-11
  d: number;
}

// ---------- date helpers (timezone-safe: dates are handled as plain year/month/day) ----------
const pad = (n: number) => String(n).padStart(2, '0');
const toISO = ({ y, m, d }: YMD) => `${y}-${pad(m + 1)}-${pad(d)}`;
const parseISO = (value?: string | null): YMD | null => {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})/.exec(value) : null;
  return match ? { y: +match[1], m: +match[2] - 1, d: +match[3] } : null;
};
const today = (): YMD => {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const sameDay = (a: YMD | null, b: YMD | null) => !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;
const addDays = ({ y, m, d }: YMD, n: number): YMD => {
  const t = new Date(y, m, d + n);
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
};
const addMonths = ({ y, m, d }: YMD, n: number): YMD => {
  const first = new Date(y, m + n, 1);
  const ny = first.getFullYear();
  const nm = first.getMonth();
  return { y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) };
};

/** 6 weeks × 7 days for the month, starting on DATE_PICKER.weekStartsOn. */
const monthGrid = (y: number, m: number): YMD[] => {
  const offset = (new Date(y, m, 1).getDay() - DATE_PICKER.weekStartsOn + 7) % 7;
  return Array.from({ length: 42 }, (_, i) => addDays({ y, m, d: 1 }, i - offset));
};

/** Sets the hidden input's value and fires a real input event, so react-hook-form's
 *  `register` and controlled `onChange` handlers both see the change. */
const commitToInput = (input: HTMLInputElement | null, value: string) => {
  if (!input) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

const POPOVER_WIDTH = 296;
const POPOVER_GAP = 6;

/**
 * Date field with a calendar popover (days → months → years views, Today / Clear, min/max,
 * keyboard navigation). Works as a drop-in for <input type="date">: the value is "YYYY-MM-DD".
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    { label, error, helperText, className = '', id, style, value, defaultValue, onChange, onFocus, onBlur, min, max, placeholder, disabled, required, ...props },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);

    const [internalValue, setInternalValue] = useState<string>(
      typeof value === 'string' ? value : typeof defaultValue === 'string' ? defaultValue : ''
    );
    useEffect(() => {
      if (value !== undefined) setInternalValue(String(value || ''));
    }, [value]);

    const current = value !== undefined ? String(value || '') : internalValue;
    const selected = parseISO(current);
    const minDate = parseISO(typeof min === 'string' ? min : undefined);
    const maxDate = parseISO(typeof max === 'string' ? max : undefined);
    const isDisabledDay = (day: YMD) =>
      (!!minDate && toISO(day) < toISO(minDate)) || (!!maxDate && toISO(day) > toISO(maxDate));

    const [open, setOpen] = useState(false);
    const [view, setView] = useState<View>('days');
    const [cursor, setCursor] = useState<YMD>(selected || today()); // focused day / visible month
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

    const setMergedRef = (node: HTMLInputElement | null) => {
      inputRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      if (node && value === undefined && node.value && node.value !== internalValue) setInternalValue(node.value);
    };

    const openPicker = () => {
      if (disabled) return;
      setCursor(selected || today());
      setView('days');
      setOpen(true);
    };
    const closePicker = useCallback((refocus = true) => {
      setOpen(false);
      if (refocus) triggerRef.current?.focus();
    }, []);

    const pick = (day: YMD | null) => {
      if (day && isDisabledDay(day)) return;
      const iso = day ? toISO(day) : '';
      setInternalValue(iso);
      commitToInput(inputRef.current, iso);
      closePicker();
    };

    // Position the popover under the field (or above it when there is no room below).
    const place = useCallback(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const r = trigger.getBoundingClientRect();
      const width = Math.min(POPOVER_WIDTH, window.innerWidth - 16);
      const height = popoverRef.current?.offsetHeight || 360;
      const below = window.innerHeight - r.bottom;
      const top = below >= height + POPOVER_GAP || below >= r.top ? r.bottom + POPOVER_GAP : r.top - height - POPOVER_GAP;
      const left = Math.min(Math.max(8, r.left), window.innerWidth - width - 8);
      setPosition({ top: Math.max(8, top), left, width });
    }, []);

    useLayoutEffect(() => {
      if (!open) return;
      place();
      window.addEventListener('resize', place);
      window.addEventListener('scroll', place, true);
      return () => {
        window.removeEventListener('resize', place);
        window.removeEventListener('scroll', place, true);
      };
    }, [open, view, place]);

    // Close on outside click.
    useEffect(() => {
      if (!open) return;
      const onDown = (e: MouseEvent | TouchEvent) => {
        const t = e.target as Node;
        if (popoverRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
        closePicker(false);
      };
      document.addEventListener('mousedown', onDown);
      document.addEventListener('touchstart', onDown);
      return () => {
        document.removeEventListener('mousedown', onDown);
        document.removeEventListener('touchstart', onDown);
      };
    }, [open, closePicker]);

    // Keep keyboard focus on the cursor day.
    useEffect(() => {
      if (open && view === 'days') {
        popoverRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toISO(cursor)}"]`)?.focus({ preventScroll: true });
      }
    }, [open, view, cursor]);

    const onGridKey = (e: React.KeyboardEvent) => {
      const moves: Record<string, () => YMD> = {
        ArrowLeft: () => addDays(cursor, -1),
        ArrowRight: () => addDays(cursor, 1),
        ArrowUp: () => addDays(cursor, -7),
        ArrowDown: () => addDays(cursor, 7),
        PageUp: () => addMonths(cursor, -1),
        PageDown: () => addMonths(cursor, 1),
      };
      if (moves[e.key]) {
        e.preventDefault();
        setCursor(moves[e.key]());
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        pick(cursor);
      }
    };
    const onPopoverKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // don't also close a surrounding dialog
        closePicker();
      }
    };

    const t = today();
    const yearPageStart = cursor.y - (cursor.y % DATE_PICKER.yearsPerPage);
    const headerLabel =
      view === 'days'
        ? `${DATE_PICKER.monthNames[cursor.m]} ${cursor.y}`
        : view === 'months'
        ? String(cursor.y)
        : `${yearPageStart} – ${yearPageStart + DATE_PICKER.yearsPerPage - 1}`;
    const step = (dir: -1 | 1) =>
      setCursor((c) =>
        view === 'days' ? addMonths(c, dir) : view === 'months' ? addMonths(c, 12 * dir) : addMonths(c, 12 * DATE_PICKER.yearsPerPage * dir)
      );
    const weekdays = Array.from({ length: 7 }, (_, i) => DATE_PICKER.weekdayNames[(i + DATE_PICKER.weekStartsOn) % 7]);

    const popover = open && (
      <div
        ref={popoverRef}
        className={styles.popover}
        style={position ? { top: position.top, left: position.left, width: position.width } : { visibility: 'hidden' }}
        role="dialog"
        aria-label={label ? `Choose ${label}` : 'Choose date'}
        onKeyDown={onPopoverKey}
      >
        <div className={styles.header}>
          <button type="button" className={styles.navBtn} onClick={() => step(-1)} aria-label="Previous">
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={styles.title}
            onClick={() => setView(view === 'days' ? 'months' : 'years')}
            disabled={view === 'years'}
          >
            {headerLabel}
          </button>
          <button type="button" className={styles.navBtn} onClick={() => step(1)} aria-label="Next">
            <ChevronRight size={16} />
          </button>
        </div>

        {view === 'days' && (
          <div onKeyDown={onGridKey}>
            <div className={styles.weekdays}>
              {weekdays.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className={styles.grid} role="grid">
              {monthGrid(cursor.y, cursor.m).map((day) => {
                const iso = toISO(day);
                const outside = day.m !== cursor.m;
                const off = isDisabledDay(day);
                return (
                  <button
                    key={iso}
                    type="button"
                    data-day={iso}
                    tabIndex={sameDay(day, cursor) ? 0 : -1}
                    disabled={off}
                    aria-selected={sameDay(day, selected)}
                    aria-label={formatDate(iso)}
                    className={[
                      styles.day,
                      outside && styles.outside,
                      sameDay(day, t) && styles.today,
                      sameDay(day, selected) && styles.selected,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => pick(day)}
                    onFocus={() => !sameDay(day, cursor) && setCursor(day)}
                  >
                    {day.d}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === 'months' && (
          <div className={styles.cells}>
            {DATE_PICKER.monthNames.map((name, m) => (
              <button
                key={name}
                type="button"
                className={[styles.cell, selected && selected.y === cursor.y && selected.m === m && styles.selected].filter(Boolean).join(' ')}
                onClick={() => {
                  setCursor({ y: cursor.y, m, d: Math.min(cursor.d, daysInMonth(cursor.y, m)) });
                  setView('days');
                }}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        )}

        {view === 'years' && (
          <div className={styles.cells}>
            {Array.from({ length: DATE_PICKER.yearsPerPage }, (_, i) => yearPageStart + i).map((y) => (
              <button
                key={y}
                type="button"
                className={[styles.cell, selected?.y === y && styles.selected, t.y === y && styles.today].filter(Boolean).join(' ')}
                onClick={() => {
                  setCursor({ y, m: cursor.m, d: Math.min(cursor.d, daysInMonth(y, cursor.m)) });
                  setView('months');
                }}
              >
                {y}
              </button>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <button type="button" className={styles.linkBtn} onClick={() => pick(t)} disabled={isDisabledDay(t)}>
            Today
          </button>
          {!required && current && (
            <button type="button" className={styles.linkBtn} onClick={() => pick(null)}>
              Clear
            </button>
          )}
        </div>
      </div>
    );

    return (
      <div className="form-group">
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required}>*</span>}
          </label>
        )}

        <div className={styles.field}>
          <button
            ref={triggerRef}
            type="button"
            id={inputId}
            className={`form-input ${styles.trigger} ${open ? styles.triggerOpen : ''} ${error ? styles.triggerError : ''} ${className}`.trim()}
            style={style}
            disabled={disabled}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => (open ? closePicker() : openPicker())}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown' && !open) {
                e.preventDefault();
                openPicker();
              }
            }}
          >
            <Calendar size={15} className={styles.triggerIcon} aria-hidden />
            <span className={current ? styles.value : styles.placeholder}>
              {current ? formatDate(current, current) : placeholder || 'Select date'}
            </span>
          </button>

          {/* Hidden native input: carries the form value, name, validation (required/min/max). */}
          <input
            ref={setMergedRef}
            type="date"
            tabIndex={-1}
            aria-hidden
            className={styles.hiddenInput}
            value={value}
            defaultValue={defaultValue}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            onChange={(e) => {
              setInternalValue(e.target.value);
              onChange?.(e);
            }}
            onFocus={onFocus}
            onBlur={onBlur}
            {...props}
          />
        </div>

        {error && <span className={styles.error}>{error}</span>}
        {!error && helperText && <span className={styles.helper}>{helperText}</span>}

        {popover && typeof document !== 'undefined' ? createPortal(popover, document.body) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
