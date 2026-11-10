import React from 'react';
import { Search } from 'lucide-react';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { ViewSwitcher } from './ViewSwitcher';
import type { SelectOption } from '../../constants';

export interface SegmentedTab<T extends string = string> {
  value: T;
  label: string;
  count?: number;
  /** Colour of the active tab: 'pending' (red) / 'cleared' (green). */
  tone?: 'pending' | 'cleared';
}

export interface SegmentedTabsProps<T extends string = string> {
  tabs: SegmentedTab<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/** Pill-style tabs with optional counts (e.g. All Players 35 · Pending Due 11 · Cleared 24). */
export function SegmentedTabs<T extends string = string>({ tabs, value, onChange, className = '' }: SegmentedTabsProps<T>) {
  return (
    <div className={`ledger-tab-group ${className}`.trim()} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={value === tab.value}
          className={`ledger-tab ${tab.tone ? `tab-${tab.tone}` : ''} ${value === tab.value ? 'active' : ''}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export interface ToolbarFilter {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption<string>[];
}

export interface ListToolbarProps<T extends string = string> {
  tabs?: SegmentedTabsProps<T>;
  search?: { value: string; onChange: (value: string) => void; placeholder: string };
  filters?: ToolbarFilter[];
  view?: { value: 'table' | 'grid'; onChange: (value: 'table' | 'grid') => void };
  add?: { label: string; onClick: () => void };
}

/**
 * Toolbar shared by every list page: [tabs] [search] [filters…]   [List | Grid] [Add …].
 * Layout and responsive behaviour come from the .filter-bar styles in globals.css.
 */
export function ListToolbar<T extends string = string>({ tabs, search, filters = [], view, add }: ListToolbarProps<T>) {
  return (
    <div className="filter-bar">
      <div className="filter-bar-left">
        {tabs && <SegmentedTabs {...tabs} />}
        {search && (
          <div className="filter-field filter-field-search">
            <Input
              placeholder={search.placeholder}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
        )}
        {filters.map((filter, i) => (
          <div key={i} className="filter-field">
            <Select value={filter.value} onChange={(e) => filter.onChange(e.target.value)} options={filter.options} />
          </div>
        ))}
      </div>

      {(view || add) && (
        <div className="filter-bar-right">
          {view && <ViewSwitcher viewMode={view.value} onChange={view.onChange} />}
          {add && (
            <Button variant="primary" size="sm" onClick={add.onClick}>
              {add.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
