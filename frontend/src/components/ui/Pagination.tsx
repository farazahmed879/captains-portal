import React from "react";
import { Button } from "./Button";
import { CustomSelect } from "./Select";
import { PAGINATION } from "../../constants";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = PAGINATION.defaultPageSize,
  pageSizeOptions = [...PAGINATION.pageSizeOptions],
  onPageChange,
  onPageSizeChange,
  itemName = "Items",
}) => {
  if (totalPages <= 1 && !totalItems && !onPageSizeChange) return null;

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = totalItems
    ? Math.min(currentPage * pageSize, totalItems)
    : currentPage * pageSize;

  return (
    <div className="pagination">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
        }}
      >
        {onPageSizeChange && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
            }}
          >
            <span>Rows per page:</span>
            <div style={{ width: "76px" }}>
              <CustomSelect
                size="sm"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                options={pageSizeOptions.map((opt) => ({
                  value: opt,
                  label: String(opt),
                }))}
                title="Select rows per page limit"
                searchable={false}
              />
            </div>
          </div>
        )}

        <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
          {totalItems !== undefined ? (
            <>
              Showing <strong>{startItem}</strong> to <strong>{endItem}</strong>{" "}
              of <strong>{totalItems}</strong> {itemName}
            </>
          ) : (
            <>
              Page <strong>{currentPage}</strong> of{" "}
              <strong>{totalPages}</strong>
            </>
          )}
        </div>
      </div>

      <div
        className="page-controls"
        style={{ display: "flex", alignItems: "center", gap: "8px" }}
      >
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <span>Prev</span>
        </Button>

        <span
          style={{
            fontSize: "12.5px",
            fontWeight: 700,
            color: "var(--text-primary)",
            padding: "4px 10px",
            background: "var(--bg-primary)",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
          }}
        >
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span>Next</span>
        </Button>
      </div>
    </div>
  );
};
