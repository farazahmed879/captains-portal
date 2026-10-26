import React from 'react';
import {
  Crown,
  Shield,
  ShieldCheck,
  User,
  SlidersHorizontal,
  Phone,
  Mail,
  Trash2,
} from 'lucide-react';
import { Column } from '../ui/DataTable';
import { Button, Avatar } from '../ui';
import { RoleSelectDropdown } from '../RoleSelectDropdown';
import { ManagedUser } from './types';

export interface UserRoleColumnActions {
  currentUserId?: string;
  isStatusPending: boolean;
  isRolePending: boolean;
  isDeletePending: boolean;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onDeleteUser: (user: ManagedUser) => void;
  totalUsersCount: number;
}

export const getUserRoleColumns = ({
  currentUserId,
  isStatusPending,
  isRolePending,
  isDeletePending,
  onToggleStatus,
  onUpdateRole,
  onDeleteUser,
  totalUsersCount,
}: UserRoleColumnActions): Column<ManagedUser>[] => [
  {
    header: 'User Details',
    width: '30%',
    render: (u: ManagedUser) => {
      const isCurrentLoggedUser = currentUserId === u._id;
      return (
        <div className="admin-user-cell">
          <Avatar
            name={u.name}
            size="sm"
            className={`admin-user-avatar role-${u.role}`}
          />
          <div className="admin-user-info">
            <div className="admin-user-name-row">
              <span className="admin-user-name">{u.name}</span>
              {isCurrentLoggedUser && <span className="admin-you-badge">You</span>}
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
      );
    },
  },
  {
    header: 'Current Role',
    width: '18%',
    render: (u: ManagedUser) => (
      <div className={`admin-role-badge ${u.role}`}>
        {u.role === 'super_admin' && <Crown size={12} />}
        {u.role === 'admin' && <ShieldCheck size={12} />}
        {u.role === 'captain' && <Shield size={12} />}
        {u.role === 'viewer' && <User size={12} />}
        {u.role === 'treasurer' && <SlidersHorizontal size={12} />}
        <span>{u.roleLabel}</span>
      </div>
    ),
  },
  {
    header: 'Linked Player / Squad',
    width: '22%',
    render: (u: ManagedUser) =>
      u.player ? (
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
      ),
  },
  {
    header: 'Status',
    width: '12%',
    render: (u: ManagedUser) => {
      const isCurrentLoggedUser = currentUserId === u._id;
      const isSuperAdmin = u.role === 'super_admin';
      return (
        <Button
          variant="ghost"
          size="sm"
          className={`admin-status-toggle ${u.isActive ? 'active' : 'inactive'}`}
          onClick={() => onToggleStatus(u._id, u.isActive)}
          disabled={isCurrentLoggedUser || isStatusPending || isSuperAdmin}
          title={
            isSuperAdmin
              ? 'Super Admin account is permanently active'
              : isCurrentLoggedUser
              ? 'Cannot deactivate self'
              : 'Click to toggle active status'
          }
        >
          <span className="admin-status-dot" />
          <span>{u.isActive ? 'Active' : 'Suspended'}</span>
        </Button>
      );
    },
  },
  {
    header: 'Role Management',
    align: 'right',
    width: '18%',
    render: (u: ManagedUser, index: number) => {
      const isCurrentLoggedUser = currentUserId === u._id;
      const isSuperAdmin = u.role === 'super_admin';
      const openUpward = totalUsersCount <= 2 || index >= totalUsersCount - 1;

      return (
        <div className="admin-role-action-cell" style={{ justifyContent: 'flex-end' }}>
          <RoleSelectDropdown
            currentRole={u.role}
            onChange={(newRole) => onUpdateRole(u._id, newRole)}
            disabled={isRolePending || isSuperAdmin}
            align="right"
            openUpward={openUpward}
          />

          {!isCurrentLoggedUser && !isSuperAdmin && (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onClick={() => onDeleteUser(u)}
              className="admin-delete-btn"
              title={`Delete ${u.name}`}
              disabled={isDeletePending}
              icon={<Trash2 size={13} />}
            />
          )}
        </div>
      );
    },
  },
];
