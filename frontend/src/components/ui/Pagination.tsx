import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 15,
  onPageChange,
  itemName = 'Items',
}) => {
  if (totalPages <= 1 && !totalItems) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  return (
    <div className="pagination">
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {totalItems !== undefined ? (
          <>
            Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
            <strong>{totalItems}</strong> {itemName}
          </>
        ) : (
          <>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </>
        )}
      </div>

      <div className="page-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          icon={<ChevronLeftIcon size={14} />}
        >
          <span>Prev</span>
        </Button>

        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            padding: '4px 10px',
            background: 'var(--bg-primary)',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
        >
          {currentPage} / {totalPages}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          iconRight={<ChevronRightIcon size={14} />}
        >
          <span>Next</span>
        </Button>
      </div>
    </div>
  );
};
