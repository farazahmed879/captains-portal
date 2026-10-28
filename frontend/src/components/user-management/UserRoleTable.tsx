import React, { useMemo } from 'react';
import { AlertCircle, Users } from 'lucide-react';
import { Button, DataTable, Pagination } from '../ui';
import { getUserRoleColumns } from './userRoleColumns';
import { ManagedUser } from './types';

export interface UserRoleTableProps {
  isLoading: boolean;
  isError: boolean;
  users: ManagedUser[];
  currentUserId?: string;
  isStatusPending: boolean;
  isRolePending: boolean;
  isDeletePending: boolean;
  onRetry: () => void;
  onResetFilters: () => void;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onDeleteUser: (user: ManagedUser) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const UserRoleTable: React.FC<UserRoleTableProps> = ({
  isLoading,
  isError,
  users,
  currentUserId,
  isStatusPending,
  isRolePending,
  isDeletePending,
  onRetry,
  onResetFilters,
  onToggleStatus,
  onUpdateRole,
  onDeleteUser,
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [5, 10, 20, 50],
  onPageChange,
  onPageSizeChange,
  selectedIds = [],
  onSelectionChange,
}) => {
  const columns = useMemo(
    () =>
      getUserRoleColumns({
        currentUserId,
        isStatusPending,
        isRolePending,
        isDeletePending,
        onToggleStatus,
        onUpdateRole,
        onDeleteUser,
        totalUsersCount: totalItems,
      }),
    [
      currentUserId,
      isStatusPending,
      isRolePending,
      isDeletePending,
      onToggleStatus,
      onUpdateRole,
      onDeleteUser,
      totalItems,
    ]
  );

  return (
    <div className="admin-table-card">
      {isError ? (
        <div className="admin-table-error">
          <AlertCircle size={24} color="#f43f5e" />
          <p>Could not fetch user directory from server.</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      ) : (
        <>
          <DataTable<ManagedUser>
            data={users}
            columns={columns}
            loading={isLoading}
            emptyMessage="No users found matching your search and role filters."
            emptyIcon={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Users size={32} color="#94a3b8" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onResetFilters}
                  style={{ marginTop: '6px' }}
                >
                  Reset Filters
                </Button>
              </div>
            }
            rowClassName={(u) => (!u.isActive ? 'user-suspended' : '')}
            keyExtractor={(u) => u._id}
            selectable={Boolean(onSelectionChange)}
            selectedIds={selectedIds}
            onSelectionChange={onSelectionChange}
          />
          {!isLoading && totalItems > 0 && (
            <div style={{ borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                itemName="Users"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};
