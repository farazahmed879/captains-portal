import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from './Table';
import { TableSkeletonRows } from './Skeleton';
import { Checkbox } from './Checkbox';

export interface Column<T> {
  header: React.ReactNode;
  render: (item: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
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

  const totalColumnsCount = columns.length + (isSelectable ? 1 : 0);

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
          {columns.map((col, idx) => (
            <TableHead
              key={idx}
              align={col.align || 'left'}
              className={col.className}
              style={{
                textAlign: col.align || 'left',
                width: col.width,
                ...col.style,
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
                  background: isSelected ? '#fff1f2' : undefined,
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
