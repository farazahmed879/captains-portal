"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import {
  ManagedUser,
  UsersApiResponse,
  RoleFilterType,
  ActionFeedback,
  UserRoleHeader,
  UserRoleStats,
  UserRoleToolbar,
  UserRoleTable,
  AddUserModal,
} from "./user-management";

export const UserRoleManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Search, Filter & Pagination state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback | null>(
    null,
  );

  // Fetch all users
  const { data, isLoading, isError, refetch } = useQuery<UsersApiResponse>({
    queryKey: ["admin-users-list"],
    queryFn: () => fetchApi<UsersApiResponse>("/users"),
    refetchInterval: 15000,
  });

  // Role Update Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      fetchApi<{ success: boolean; message: string }>(`/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setActionFeedback({
        type: "success",
        message: res.message || "User role successfully updated.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to update user role.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      fetchApi<{ success: boolean; message: string }>(
        `/users/${userId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        },
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setActionFeedback({
        type: "success",
        message: res.message || "User status updated.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to update user status.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchApi<{ success: boolean; message: string }>(`/users/${userId}`, {
        method: "DELETE",
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setActionFeedback({
        type: "success",
        message: res.message || "User deleted successfully.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to delete user.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) =>
      fetchApi<{ success: boolean; message: string }>("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users-list"] });
      setIsAddUserModalOpen(false);
      setActionFeedback({
        type: "success",
        message: res.message || "New user added successfully.",
      });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({
        type: "error",
        message: err.message || "Failed to create user.",
      });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  const users = data?.users || [];
  const counts = data?.counts || {
    total: 0,
    superAdmins: 0,
    admins: 0,
    captains: 0,
    normalPlayers: 0,
    treasurers: 0,
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !searchTerm ||
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.phone && u.phone.includes(searchTerm));

      let matchesRole = true;
      if (roleFilter === "captains") {
        matchesRole = u.role === "captain";
      } else if (roleFilter === "players") {
        matchesRole = u.role === "viewer";
      } else if (roleFilter === "admins") {
        matchesRole = u.role === "admin";
      } else if (roleFilter === "super_admins") {
        matchesRole = u.role === "super_admin";
      } else if (roleFilter === "treasurers") {
        matchesRole = u.role === "treasurer";
      }

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  // Automatically adjust page if out of bounds
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated users slice
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const handleDeleteUser = (u: ManagedUser) => {
    if (
      window.confirm(
        `Are you sure you want to delete user account "${u.name}"?`,
      )
    ) {
      deleteUserMutation.mutate(u._id);
    }
  };

  return (
    <div className="admin-user-mgmt-section">
      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`admin-feedback-toast ${actionFeedback.type}`}
          role="status"
        >
          {actionFeedback.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{actionFeedback.message}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="admin-toast-close"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <UserRoleHeader
        isLoading={isLoading}
        onRefresh={() => refetch()}
        onOpenAddModal={() => setIsAddUserModalOpen(true)}
      />

      {/* Search & Filter Toolbar */}
      <UserRoleToolbar
        searchTerm={searchTerm}
        onSearchChange={(val) => {
          setSearchTerm(val);
          setCurrentPage(1);
        }}
        roleFilter={roleFilter}
        onFilterChange={(val) => {
          setRoleFilter(val);
          setCurrentPage(1);
        }}
        counts={counts}
      />

      {/* Users Data Table with Pagination */}
      <UserRoleTable
        isLoading={isLoading}
        isError={isError}
        users={paginatedUsers}
        currentUserId={currentUser?.id}
        isStatusPending={toggleStatusMutation.isPending}
        isRolePending={updateRoleMutation.isPending}
        isDeletePending={deleteUserMutation.isPending}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20, 50]}
        onPageChange={setCurrentPage}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        onRetry={() => refetch()}
        onResetFilters={() => {
          setSearchTerm("");
          setRoleFilter("all");
          setCurrentPage(1);
        }}
        onToggleStatus={(userId, currentStatus) =>
          toggleStatusMutation.mutate({ userId, isActive: !currentStatus })
        }
        onUpdateRole={(userId, newRole) =>
          updateRoleMutation.mutate({ userId, newRole })
        }
        onDeleteUser={handleDeleteUser}
      />

      {/* Add New User Modal */}
      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        isPending={createUserMutation.isPending}
        onSubmit={(userData) => createUserMutation.mutate(userData)}
      />
    </div>
  );
};
