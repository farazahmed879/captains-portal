'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import {
  Users,
  Shield,
  Crown,
  User,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Modal } from './Modal';
import { RoleSelectDropdown, ROLE_LIST } from './RoleSelectDropdown';

export interface ManagedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'captain' | 'treasurer' | 'viewer';
  roleLabel: string;
  isCaptain: boolean;
  isPlayer: boolean;
  isActive: boolean;
  tenant?: { id: string; name: string };
  player?: {
    _id: string;
    name: string;
    jerseyNumber?: number;
    role?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface UsersApiResponse {
  success: boolean;
  users: ManagedUser[];
  counts: {
    total: number;
    superAdmins: number;
    captains: number;
    normalPlayers: number;
    treasurers: number;
  };
}

export const UserRoleManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New User Form State
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('password123');
  const [newUserRole, setNewUserRole] = useState<'captain' | 'viewer' | 'treasurer' | 'super_admin'>('captain');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch all users
  const { data, isLoading, isError, refetch } = useQuery<UsersApiResponse>({
    queryKey: ['admin-users-list'],
    queryFn: () => fetchApi<UsersApiResponse>('/users'),
    refetchInterval: 15000,
  });

  // Role Update Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, newRole }: { userId: string; newRole: string }) =>
      fetchApi<{ success: boolean; message: string }>(`/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setActionFeedback({ type: 'success', message: res.message || 'User role successfully updated.' });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update user role.' });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      fetchApi<{ success: boolean; message: string }>(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setActionFeedback({ type: 'success', message: res.message || 'User status updated.' });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to update user status.' });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Delete User Mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) =>
      fetchApi<{ success: boolean; message: string }>(`/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setActionFeedback({ type: 'success', message: res.message || 'User deleted successfully.' });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete user.' });
      setTimeout(() => setActionFeedback(null), 5000);
    },
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (userData: any) =>
      fetchApi<{ success: boolean; message: string }>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      setIsAddUserModalOpen(false);
      setNewUserName('');
      setNewUserPhone('');
      setNewUserEmail('');
      setNewUserPassword('password123');
      setNewUserRole('captain');
      setFormError(null);
      setActionFeedback({ type: 'success', message: res.message || 'New user added successfully.' });
      setTimeout(() => setActionFeedback(null), 4000);
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create user.');
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newUserName.trim()) {
      setFormError('Please enter user name.');
      return;
    }
    if (!newUserPhone.trim() && !newUserEmail.trim()) {
      setFormError('Please provide either phone number or email.');
      return;
    }
    if (!newUserPassword || newUserPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    createUserMutation.mutate({
      name: newUserName.trim(),
      phone: newUserPhone.trim() || undefined,
      email: newUserEmail.trim() || undefined,
      password: newUserPassword,
      role: newUserRole,
    });
  };

  const users = data?.users || [];
  const counts = data?.counts || { total: 0, superAdmins: 0, captains: 0, normalPlayers: 0, treasurers: 0 };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));

    let matchesRole = true;
    if (roleFilter === 'captains') {
      matchesRole = u.role === 'captain';
    } else if (roleFilter === 'players') {
      matchesRole = u.role === 'viewer';
    } else if (roleFilter === 'super_admins') {
      matchesRole = u.role === 'super_admin';
    } else if (roleFilter === 'treasurers') {
      matchesRole = u.role === 'treasurer';
    }

    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-user-mgmt-section">
      {/* Action Notification Banner */}
      {actionFeedback && (
        <div
          className={`admin-feedback-toast ${actionFeedback.type}`}
          role="status"
        >
          {actionFeedback.type === 'success' ? (
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

      {/* Header & Metrics Header Bar */}
      <div className="admin-mgmt-header">
        <div className="admin-mgmt-title-block">
          <div className="admin-mgmt-badge">
            <Crown size={14} color="#a855f7" />
            <span>Super Admin Command</span>
          </div>
          <h2 className="admin-mgmt-title">User Roster & Role Management</h2>
          <p className="admin-mgmt-subtitle">
            Complete directory of registered portal accounts. Manage permissions, assign <strong>Team Captains</strong> or <strong>Normal Players</strong>, and control access.
          </p>
        </div>

        <div className="admin-mgmt-actions-row">
          <button
            type="button"
            onClick={() => refetch()}
            className="btn btn-secondary btn-sm"
            title="Refresh user list"
          >
            <RefreshCw size={13} className={isLoading ? 'admin-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddUserModalOpen(true)}
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600 }}
          >
            <Plus size={14} />
            <span>Add / Invite User</span>
          </button>
        </div>
      </div>

      {/* Role Counts Stat Cards */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card total" onClick={() => setRoleFilter('all')} role="button" tabIndex={0}>
          <div className="admin-stat-icon total">
            <Users size={18} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{counts.total}</span>
            <span className="admin-stat-label">Total Users</span>
          </div>
        </div>

        <div
          className={`admin-stat-card captains ${roleFilter === 'captains' ? 'selected' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'captains' ? 'all' : 'captains')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-stat-icon captains">
            <Shield size={18} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{counts.captains}</span>
            <span className="admin-stat-label">Team Captains</span>
          </div>
        </div>

        <div
          className={`admin-stat-card players ${roleFilter === 'players' ? 'selected' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'players' ? 'all' : 'players')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-stat-icon players">
            <User size={18} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{counts.normalPlayers}</span>
            <span className="admin-stat-label">Normal Players</span>
          </div>
        </div>

        <div
          className={`admin-stat-card admins ${roleFilter === 'super_admins' ? 'selected' : ''}`}
          onClick={() => setRoleFilter(roleFilter === 'super_admins' ? 'all' : 'super_admins')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-stat-icon admins">
            <Crown size={18} />
          </div>
          <div className="admin-stat-content">
            <span className="admin-stat-number">{counts.superAdmins}</span>
            <span className="admin-stat-label">Super Admins</span>
          </div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="admin-table-toolbar">
        <div className="admin-search-box">
          <Search size={15} className="admin-search-icon" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search users by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Role Filter Pills */}
        <div className="admin-filter-pills">
          <button
            type="button"
            className={`admin-filter-pill ${roleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setRoleFilter('all')}
          >
            All Users ({counts.total})
          </button>
          <button
            type="button"
            className={`admin-filter-pill captains ${roleFilter === 'captains' ? 'active' : ''}`}
            onClick={() => setRoleFilter('captains')}
          >
            <Shield size={12} />
            Captains ({counts.captains})
          </button>
          <button
            type="button"
            className={`admin-filter-pill players ${roleFilter === 'players' ? 'active' : ''}`}
            onClick={() => setRoleFilter('players')}
          >
            <User size={12} />
            Normal Players ({counts.normalPlayers})
          </button>
          <button
            type="button"
            className={`admin-filter-pill admins ${roleFilter === 'super_admins' ? 'active' : ''}`}
            onClick={() => setRoleFilter('super_admins')}
          >
            <Crown size={12} />
            Admins ({counts.superAdmins})
          </button>
        </div>
      </div>

      {/* Users Data Table */}
      <div className="admin-table-card">
        {isLoading ? (
          <div className="admin-table-loading">
            <RefreshCw size={24} className="admin-spin" color="#0284c7" />
            <span>Loading user directory & roles...</span>
          </div>
        ) : isError ? (
          <div className="admin-table-error">
            <AlertCircle size={24} color="#f43f5e" />
            <p>Could not fetch user directory from server.</p>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              Try Again
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-table-empty">
            <Users size={32} color="#94a3b8" />
            <p>No users found matching your search and role filters.</p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="admin-table-responsive">
            <table className="admin-user-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Current Role</th>
                  <th>Classification</th>
                  <th>Linked Player / Squad</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Role Management</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => {
                  const isCurrentLoggedUser = currentUser?.id === u._id;

                  return (
                    <tr key={u._id} className={!u.isActive ? 'user-suspended' : ''}>
                      {/* 1. User Details */}
                      <td>
                        <div className="admin-user-cell">
                          <div className={`admin-user-avatar role-${u.role}`}>
                            {u.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()}
                          </div>
                          <div className="admin-user-info">
                            <div className="admin-user-name-row">
                              <span className="admin-user-name">{u.name}</span>
                              {isCurrentLoggedUser && (
                                <span className="admin-you-badge">You</span>
                              )}
                            </div>
                            <div className="admin-user-sub">
                              {u.phone && (
                                <span className="admin-user-contact">
                                  <Phone size={11} />
                                  <span>{u.phone}</span>
                                </span>
                              )}
                              {u.email && (
                                <span className="admin-user-contact">
                                  <Mail size={11} />
                                  <span>{u.email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Current Role Badge */}
                      <td>
                        <div className={`admin-role-badge ${u.role}`}>
                          {u.role === 'super_admin' && <Crown size={12} />}
                          {u.role === 'captain' && <Shield size={12} />}
                          {u.role === 'viewer' && <User size={12} />}
                          {u.role === 'treasurer' && <SlidersHorizontal size={12} />}
                          <span>{u.roleLabel}</span>
                        </div>
                      </td>

                      {/* 3. Classification (Captain vs Player) */}
                      <td>
                        <div className="admin-classification-pill">
                          {u.role === 'captain' || u.role === 'super_admin' ? (
                            <span className="badge-tag captain">
                              🛡️ Captain Access
                            </span>
                          ) : (
                            <span className="badge-tag player">
                              🏏 Normal Player
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Linked Player Profile */}
                      <td>
                        {u.player ? (
                          <div className="admin-linked-player">
                            <span className="admin-player-name">
                              {u.player.name}
                              {u.player.jerseyNumber !== undefined && (
                                <span className="admin-jersey">#{u.player.jerseyNumber}</span>
                              )}
                            </span>
                            <span className="admin-player-meta">
                              {u.player.role?.replace('_', ' ') || 'Squad Member'}
                            </span>
                          </div>
                        ) : (
                          <span className="admin-no-player">No player profile linked</span>
                        )}
                      </td>

                      {/* 5. Status Pill */}
                      <td>
                        <button
                          type="button"
                          className={`admin-status-toggle ${u.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleStatusMutation.mutate({ userId: u._id, isActive: !u.isActive })}
                          disabled={isCurrentLoggedUser || toggleStatusMutation.isPending}
                          title={isCurrentLoggedUser ? 'Cannot deactivate self' : 'Click to toggle active status'}
                        >
                          <span className="admin-status-dot" />
                          <span>{u.isActive ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* 6. Role Management Action Dropdown & Delete */}
                      <td style={{ textAlign: 'right' }}>
                        <div className="admin-role-action-cell">
                          <RoleSelectDropdown
                            currentRole={u.role}
                            onChange={(newRole) => updateRoleMutation.mutate({ userId: u._id, newRole })}
                            disabled={updateRoleMutation.isPending}
                            align="right"
                            openUpward={filteredUsers.length <= 2 || index >= filteredUsers.length - 1}
                          />

                          {!isCurrentLoggedUser && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete user account "${u.name}"?`)) {
                                  deleteUserMutation.mutate(u._id);
                                }
                              }}
                              className="admin-delete-btn"
                              title={`Delete ${u.name}`}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New User Account"
        subtitle="Invite a new Team Captain, Normal Player, or Administrator"
        maxWidth="500px"
      >
        <form onSubmit={handleCreateUser} className="admin-add-user-form">
          {formError && (
            <div className="form-error-banner" role="alert">
              <AlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          <div className="form-group" style={{ marginBottom: '14px' }}>
            <label className="form-label" htmlFor="new-user-name">
              Full Name *
            </label>
            <input
              id="new-user-name"
              type="text"
              className="form-input"
              placeholder="e.g. Babar Azam"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="new-user-phone">
                Phone Number
              </label>
              <input
                id="new-user-phone"
                type="text"
                className="form-input"
                placeholder="0300-1234567"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-user-email">
                Email Address
              </label>
              <input
                id="new-user-email"
                type="email"
                className="form-input"
                placeholder="captain@club.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Assigned Role - Interactive Visual Selection Cards */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>
              Assign Role Permission *
            </label>
            <div className="modal-role-picker-grid">
              {ROLE_LIST.map((r) => {
                const RoleIcon = r.icon;
                const isSelected = newUserRole === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    className={`modal-role-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setNewUserRole(r.value)}
                  >
                    <div className="modal-role-card-header">
                      <div
                        className="modal-role-card-icon-box"
                        style={{
                          backgroundColor: r.bgColor,
                          color: r.color,
                          borderColor: r.borderColor,
                        }}
                      >
                        <RoleIcon size={13} strokeWidth={2.5} />
                      </div>
                      <div className="modal-role-card-check-pill">
                        {isSelected && <Check size={11} strokeWidth={3} />}
                      </div>
                    </div>
                    <div className="modal-role-card-title">{r.label}</div>
                    <div className="modal-role-card-desc">{r.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" htmlFor="new-user-password">
              Initial Password *
            </label>
            <input
              id="new-user-password"
              type="text"
              className="form-input"
              placeholder="password123"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Default temporary password for first login.
            </span>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
