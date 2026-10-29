"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  size?: "sm" | "md" | "lg";
  searchable?: boolean;
  searchPlaceholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options: propOptions,
      children,
      className = "",
      id,
      style,
      placeholder = "Select...",
      size = "md",
      disabled = false,
      searchable,
      searchPlaceholder = "Search...",
      value: controlledValue,
      defaultValue,
      onChange,
      ...props
    },
    forwardedRef
  ) => {
    const selectId =
      id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    const internalSelectRef = useRef<HTMLSelectElement | null>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (controlledValue !== undefined) return String(controlledValue);
      if (defaultValue !== undefined) return String(defaultValue);
      return "";
    });

    const [coords, setCoords] = useState<{
      top: number;
      left: number;
      width: number;
      isUpward: boolean;
    } | null>(null);

    // Sync with controlled value changes
    useEffect(() => {
      if (controlledValue !== undefined) {
        setInternalValue(String(controlledValue));
      }
    }, [controlledValue]);

    useEffect(() => {
      setMounted(true);
    }, []);

    // Combine forwarded ref and internal ref
    const handleSetRef = useCallback(
      (node: HTMLSelectElement | null) => {
        internalSelectRef.current = node;
        if (typeof forwardedRef === "function") {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLSelectElement | null>).current = node;
        }
        if (node && controlledValue === undefined && node.value) {
          setInternalValue(node.value);
        }
      },
      [forwardedRef]
    );

    // Extract options from props or children (<option>)
    const parsedOptions = useMemo<SelectOption[]>(() => {
      if (propOptions && propOptions.length > 0) {
        return propOptions;
      }

      if (children) {
        const extracted: SelectOption[] = [];
        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.type === "option") {
            const val = child.props.value !== undefined ? child.props.value : child.props.children;
            extracted.push({
              value: val,
              label: String(child.props.children || val),
              disabled: child.props.disabled,
            });
          }
        });
        if (extracted.length > 0) return extracted;
      }

      return [];
    }, [propOptions, children]);

    // Determine if search input should be visible (explicit flag or auto-enabled when > 7 options)
    const isSearchActive =
      searchable === true || (searchable !== false && parsedOptions.length > 7);

    // Filtered options based on search query
    const filteredOptions = useMemo(() => {
      if (!isSearchActive || !searchQuery.trim()) {
        return parsedOptions;
      }
      const q = searchQuery.toLowerCase().trim();
      return parsedOptions.filter(
        (opt) =>
          opt.label.toLowerCase().includes(q) ||
          String(opt.value).toLowerCase().includes(q)
      );
    }, [parsedOptions, isSearchActive, searchQuery]);

    // Active selected value
    const currentValue =
      controlledValue !== undefined ? String(controlledValue) : internalValue;

    // Find currently selected option
    const selectedOption = useMemo(() => {
      return parsedOptions.find(
        (opt) => String(opt.value) === String(currentValue)
      );
    }, [parsedOptions, currentValue]);

    // Update portal coordinates
    const updateCoords = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const dropdownMaxHeight = isSearchActive ? 310 : 250;
      const gap = 5;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const isUpward = spaceBelow < dropdownMaxHeight && spaceAbove > spaceBelow;

      const top = isUpward
        ? Math.max(10, rect.top - dropdownMaxHeight - gap)
        : Math.min(window.innerHeight - dropdownMaxHeight - 10, rect.bottom + gap);

      const left = Math.max(10, Math.min(window.innerWidth - rect.width - 10, rect.left));

      setCoords({
        top,
        left,
        width: rect.width,
        isUpward,
      });
    }, [isSearchActive]);

    useEffect(() => {
      if (!isOpen) return;
      updateCoords();

      const handleScrollOrResize = () => {
        updateCoords();
      };

      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);

      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }, [isOpen, updateCoords]);

    // Auto-focus search input when opening
    useEffect(() => {
      if (isOpen) {
        setSearchQuery("");
        if (isSearchActive) {
          const timer = setTimeout(() => {
            searchInputRef.current?.focus();
          }, 60);
          return () => clearTimeout(timer);
        }
      } else {
        setSearchQuery("");
      }
    }, [isOpen, isSearchActive]);

    // Click outside to close
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          triggerRef.current &&
          !triggerRef.current.contains(target) &&
          dropdownRef.current &&
          !dropdownRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    // Handle Option Click
    const handleSelectOption = (opt: SelectOption) => {
      if (opt.disabled) return;

      const stringVal = String(opt.value);
      setInternalValue(stringVal);
      setIsOpen(false);
      setSearchQuery("");

      if (internalSelectRef.current) {
        internalSelectRef.current.value = stringVal;

        // Dispatch synthetic change event so react-hook-form receives it
        const event = new Event("change", { bubbles: true });
        internalSelectRef.current.dispatchEvent(event);
      }
    };

    // Portal Menu
    const dropdownMenu = isOpen && coords && (
      <div
        ref={dropdownRef}
        className={styles.dropdown}
        style={{
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          minWidth: `${coords.width}px`,
          maxWidth: `${Math.max(coords.width, 320)}px`,
        }}
        role="listbox"
      >
        {/* Sticky Search Filter */}
        {isSearchActive && (
          <div className={styles.searchWrapper}>
            <Search size={14} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              className={styles.searchInput}
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable Options List */}
        <div className={styles.optionsList}>
          {filteredOptions.length === 0 ? (
            <div className={styles.noResults}>
              {searchQuery ? `No results for "${searchQuery}"` : "No options available"}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(currentValue);

              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  className={`${styles.dropdownItem} ${
                    isSelected ? styles.selected : ""
                  }`}
                  disabled={opt.disabled}
                  onClick={() => handleSelectOption(opt)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className={styles.itemLabel}>{opt.label}</span>
                  {isSelected && (
                    <Check
                      size={14}
                      strokeWidth={2.6}
                      className={styles.checkIcon}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    );

    return (
      <div
        className={`${styles.formGroup} ${className}`.trim()}
        style={style}
      >
        {label && (
          <label htmlFor={selectId} className={styles.label}>
            {label}
            {props.required && (
              <span className={styles.requiredAsterisk}>*</span>
            )}
          </label>
        )}

        <div className={styles.wrapper}>
          {/* Real native select kept in DOM for react-hook-form integration */}
          <select
            ref={handleSetRef}
            id={selectId}
            value={currentValue}
            disabled={disabled}
            className={styles.hiddenSelect}
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              setInternalValue(e.target.value);
              onChange?.(e);
            }}
            {...props}
          >
            {parsedOptions.map((opt) => (
              <option
                key={String(opt.value)}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom Styled Trigger */}
          <button
            ref={triggerRef}
            type="button"
            className={`${styles.trigger} ${
              size === "sm" ? styles.sizeSm : size === "lg" ? styles.sizeLg : ""
            } ${isOpen ? styles.open : ""} ${error ? styles.hasError : ""}`}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span
              className={`${styles.valueText} ${
                !selectedOption ? styles.placeholder : ""
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>

            <ChevronDown
              size={size === "sm" ? 12 : 15}
              className={`${styles.chevron} ${isOpen ? styles.open : ""}`}
            />
          </button>
        </div>

        {/* Portal-rendered Custom Dropdown Menu */}
        {mounted && typeof document !== "undefined"
          ? createPortal(dropdownMenu, document.body)
          : dropdownMenu}

        {error && <span className={styles.errorText}>{error}</span>}
        {!error && helperText && (
          <span className={styles.helperText}>{helperText}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
export const CustomSelect = Select;
