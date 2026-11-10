import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from './Table';
import { TableSkeletonRows } from './Skeleton';
import { Checkbox } from './Checkbox';
import { useIsMobile } from '../../lib/useMediaQuery';

export interface Column<T> {
  header: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * Role in the phone layout (an expandable list): 'primary' is the always-visible title,
   * 'summary' the always-visible figure on the right, 'actions' the buttons shown when a row
   * is expanded, 'hidden' leaves the column out. Defaults: first column is primary, the first
   * right-aligned column is the summary, a column headed "Action(s)" is the actions.
   */
  mobile?: 'primary' | 'summary' | 'actions' | 'hidden';
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor?: (item: T, index: number) => string | number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
  rowClassName?: (item: T, index: number) => string;
  className?: string;
  style?: React.CSSProperties;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  showSerialNumber?: boolean;
  serialStartIndex?: number;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No records found.',
  emptyIcon,
  loading = false,
  onRowClick,
  rowClassName,
  className = '',
  style,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  showSerialNumber = true,
  serialStartIndex = 0,
}: DataTableProps<T>) {
  const getKey = (item: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(item, index);
    const anyItem = item as any;
    return anyItem?._id || anyItem?.id || index;
  };

  const isSelectable = selectable || Boolean(onSelectionChange);
  const pageKeys = data.map((item, idx) => String(getKey(item, idx)));
  const allPageSelected =
    isSelectable && pageKeys.length > 0 && pageKeys.every((k) => selectedIds.includes(k));
  const somePageSelected =
    isSelectable && !allPageSelected && pageKeys.some((k) => selectedIds.includes(k));

  const handleToggleAllPage = () => {
    if (!onSelectionChange) return;
    if (allPageSelected) {
      onSelectionChange(selectedIds.filter((id) => !pageKeys.includes(id)));
    } else {
      const merged = Array.from(new Set([...selectedIds, ...pageKeys]));
      onSelectionChange(merged);
    }
  };

  const handleToggleRow = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((k) => k !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const totalColumnsCount =
    columns.length + (isSelectable ? 1 : 0) + (showSerialNumber ? 1 : 0);

  const isMobile = useIsMobile();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  if (isMobile) {
    const headerText = (c: Column<T>) => (typeof c.header === 'string' ? c.header.trim() : '');
    const isActionsCol = (c: Column<T>) => c.mobile === 'actions' || /^actions?$/i.test(headerText(c));
    const shown = columns.filter((c) => c.mobile !== 'hidden');
    const actionsCol = shown.find(isActionsCol);
    const dataCols = shown.filter((c) => !isActionsCol(c));
    const primary = dataCols.find((c) => c.mobile === 'primary') || dataCols[0];
    const summary =
      dataCols.find((c) => c.mobile === 'summary') ||
      dataCols.find((c) => c !== primary && c.align === 'right');
    const details = dataCols.filter((c) => c !== primary && c !== summary);

    const toggle = (key: string) =>
      setOpenKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });

    return (
      <div className={`mlist ${className}`.trim()} style={style}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mlist-item">
              <div className="mlist-head">
                <div className="mlist-skeleton" />
              </div>
            </div>
          ))
        ) : data.length === 0 ? (
          <div className="mlist-empty">{emptyMessage}</div>
        ) : (
          data.map((item, index) => {
            const key = String(getKey(item, index));
            const isOpen = openKeys.has(key);
            const isSelected = isSelectable && selectedIds.includes(key);
            return (
              <div
                key={key}
                className={`mlist-item ${isOpen ? 'is-open' : ''} ${isSelected ? 'is-selected' : ''} ${
                  rowClassName ? rowClassName(item, index) : ''
                }`.trim()}
              >
                <div
                  className="mlist-head"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  onClick={() => toggle(key)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle(key);
                    }
                  }}
                >
                  {isSelectable && (
                    <span className="mlist-check" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        size="md"
                        checked={isSelected}
                        onChange={() => handleToggleRow(key)}
                        aria-label={`Select row ${key}`}
                        variant="danger"
                      />
                    </span>
                  )}
                  <div className="mlist-primary">{primary ? primary.render(item, index) : null}</div>
                  {summary && <div className="mlist-summary">{summary.render(item, index)}</div>}
                  <ChevronDown size={16} className="mlist-chevron" aria-hidden />
                </div>

                {isOpen && (
                  <div className="mlist-body">
                    {details.map((col, i) => (
                      <div key={i} className="mlist-field">
                        <div className="mlist-label">{col.header}</div>
                        <div className="mlist-value">{col.render(item, index)}</div>
                      </div>
                    ))}
                    {(actionsCol || onRowClick) && (
                      <div className="mlist-actions" onClick={(e) => e.stopPropagation()}>
                        {onRowClick && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => onRowClick(item, index)}
                          >
                            Open
                          </button>
                        )}
                        {actionsCol?.render(item, index)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <Table className={className} style={style}>
      <TableHeader>
        <TableRow>
          {isSelectable && (
            <TableHead
              align="center"
              style={{ width: '42px', textAlign: 'center', padding: '10px 8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Checkbox
                  size="md"
                  checked={allPageSelected}
                  indeterminate={somePageSelected}
                  onChange={handleToggleAllPage}
                  disabled={loading || data.length === 0}
                  aria-label="Select all on this page"
                  variant="danger"
                />
              </div>
            </TableHead>
          )}
          {showSerialNumber && (
            <TableHead
              align="center"
              style={{ width: '46px', textAlign: 'center', padding: '10px 8px' }}
            >
              #
            </TableHead>
          )}
          {columns.map((col, idx) => (
            <TableHead
              key={idx}
              align={col.align || 'left'}
              className={col.className}
              // Headers share one style; a column's cell styling (colours, weights) stays on its cells.
              style={{
                textAlign: col.align || 'left',
                width: col.width,
              }}
            >
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableSkeletonRows columnsCount={totalColumnsCount} rowsCount={6} />
        ) : data.length === 0 ? (
          <TableEmpty colSpan={totalColumnsCount} message={emptyMessage} icon={emptyIcon} />
        ) : (
          data.map((item, index) => {
            const rowKey = getKey(item, index);
            const strKey = String(rowKey);
            const isSelected = isSelectable && selectedIds.includes(strKey);
            const customClass = rowClassName ? rowClassName(item, index) : '';
            return (
              <TableRow
                key={rowKey}
                className={customClass}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                style={{
                  cursor: onRowClick ? 'pointer' : undefined,
                  background: isSelected ? '#f8fafc' : undefined,
                }}
              >
                {isSelectable && (
                  <TableCell
                    align="center"
                    style={{ width: '42px', textAlign: 'center', padding: '10px 8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Checkbox
                        size="md"
                        checked={isSelected}
                        onChange={() => handleToggleRow(strKey)}
                        aria-label={`Select row ${strKey}`}
                        variant="danger"
                      />
                    </div>
                  </TableCell>
                )}
                {showSerialNumber && (
                  <TableCell
                    align="center"
                    style={{
                      width: '46px',
                      textAlign: 'center',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: '#64748b',
                    }}
                  >
                    {serialStartIndex + index + 1}
                  </TableCell>
                )}
                {columns.map((col, colIdx) => (
                  <TableCell
                    key={colIdx}
                    align={col.align || 'left'}
                    className={col.className}
                    style={{
                      textAlign: col.align || 'left',
                      width: col.width,
                      ...col.style,
                    }}
                  >
                    {col.render(item, index)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}

export default DataTable;
