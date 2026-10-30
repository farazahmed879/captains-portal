'use client';

import React from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { Trash2, CloseIcon } from '../icons';

export interface BulkActionBarProps {
  selectedIds: string[];
  pageItemIds: string[];
  allItemIds?: string[];
  itemLabel?: string;
  onSelectChange: (ids: string[]) => void;
  onBulkDelete: () => void;
  deleting?: boolean;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  pageItemIds,
  allItemIds,
  itemLabel = 'Items',
  onSelectChange,
  onBulkDelete,
  deleting = false,
}) => {
  if (pageItemIds.length === 0 && selectedIds.length === 0) {
    return null;
  }

  const allPageSelected =
    pageItemIds.length > 0 && pageItemIds.every((id) => selectedIds.includes(id));
  const somePageSelected =
    !allPageSelected && pageItemIds.some((id) => selectedIds.includes(id));

  const toggleSelectPage = () => {
    if (allPageSelected) {
      onSelectChange(selectedIds.filter((id) => !pageItemIds.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...pageItemIds]));
      onSelectChange(merged);
    }
  };

  const selectAllItems = () => {
    if (allItemIds && allItemIds.length > 0) {
      onSelectChange(Array.from(new Set(allItemIds)));
    }
  };

  const clearSelection = () => {
    onSelectChange([]);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: selectedIds.length > 0 ? '10px 16px' : '7px 14px',
        marginBottom: '12px',
        borderRadius: '10px',
        background: selectedIds.length > 0 ? '#fff1f2' : '#f8fafc',
        border:
          selectedIds.length > 0
            ? '1px solid #fecdd3'
            : '1px solid var(--border-color)',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Checkbox
          size="md"
          variant="danger"
          checked={allPageSelected}
          indeterminate={somePageSelected}
          onChange={toggleSelectPage}
          disabled={deleting || pageItemIds.length === 0}
          label={allPageSelected ? 'Deselect Page' : `Select All on Page (${pageItemIds.length})`}
        />

        {allItemIds &&
          allItemIds.length > pageItemIds.length &&
          selectedIds.length < allItemIds.length && (
            <button
              type="button"
              onClick={selectAllItems}
              disabled={deleting}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '2px 6px',
                textDecoration: 'underline',
              }}
            >
              Select all {allItemIds.length} {itemLabel.toLowerCase()}
            </button>
          )}

        {selectedIds.length > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: '#ffe4e6',
              color: '#be123c',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            {selectedIds.length} {selectedIds.length === 1 ? itemLabel.replace(/s$/i, '') : itemLabel} Selected
          </span>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={clearSelection}
            disabled={deleting}
            icon={<CloseIcon size={12} />}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={deleting}
            onClick={onBulkDelete}
            icon={<Trash2 size={14} />}
            style={{
              background: '#e11d48',
              color: '#ffffff',
              borderColor: '#e11d48',
              fontWeight: 700,
            }}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export interface GridSelectCheckboxProps {
  checked: boolean;
  onChange: () => void;
  title?: string;
}

export const GridSelectCheckbox: React.FC<GridSelectCheckboxProps> = ({
  checked,
  onChange,
  title = 'Select item',
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        flexShrink: 0,
      }}
    >
      <Checkbox
        size="md"
        variant="danger"
        checked={checked}
        onChange={onChange}
        aria-label={title}
      />
    </div>
  );
};
