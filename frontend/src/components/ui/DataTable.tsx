import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from './Table';
import { TableSkeletonRows } from './Skeleton';

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
}: DataTableProps<T>) {
  const getKey = (item: T, index: number): string | number => {
    if (keyExtractor) return keyExtractor(item, index);
    const anyItem = item as any;
    return anyItem?._id || anyItem?.id || index;
  };

  return (
    <Table className={className} style={style}>
      <TableHeader>
        <TableRow>
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
          <TableSkeletonRows columnsCount={columns.length} rowsCount={6} />
        ) : data.length === 0 ? (
          <TableEmpty colSpan={columns.length} message={emptyMessage} icon={emptyIcon} />
        ) : (
          data.map((item, index) => {
            const rowKey = getKey(item, index);
            const customClass = rowClassName ? rowClassName(item, index) : '';
            return (
              <TableRow
                key={rowKey}
                className={customClass}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                style={{ cursor: onRowClick ? 'pointer' : undefined }}
              >
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
