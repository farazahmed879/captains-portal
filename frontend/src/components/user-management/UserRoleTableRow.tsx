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
import { Button, Avatar } from '../ui';
import { RoleSelectDropdown } from '../RoleSelectDropdown';
import { ManagedUser } from './types';

export interface UserRoleTableRowProps {
  user: ManagedUser;
  isCurrentLoggedUser: boolean;
  isFirstOrLastRow: boolean;
  isStatusPending: boolean;
  isRolePending: boolean;
  isDeletePending: boolean;
  onToggleStatus: (userId: string, currentStatus: boolean) => void;
  onUpdateRole: (userId: string, newRole: string) => void;
  onDeleteUser: (user: ManagedUser) => void;
}

export const UserRoleTableRow: React.FC<UserRoleTableRowProps> = ({
  user: u,
  isCurrentLoggedUser,
  isFirstOrLastRow,
  isStatusPending,
  isRolePending,
  isDeletePending,
  onToggleStatus,
  onUpdateRole,
  onDeleteUser,
}) => {
  const isSuperAdmin = u.role === 'super_admin';

  return (
    <tr className={!u.isActive ? 'user-suspended' : ''}>
      {/* 1. User Details */}
      <td>
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
      </td>

      {/* 2. Current Role Badge */}
      <td>
        <div className={`admin-role-badge ${u.role}`}>
          {u.role === 'super_admin' && <Crown size={12} />}
          {u.role === 'admin' && <ShieldCheck size={12} />}
          {u.role === 'captain' && <Shield size={12} />}
          {u.role === 'viewer' && <User size={12} />}
          {u.role === 'treasurer' && <SlidersHorizontal size={12} />}
          <span>{u.roleLabel}</span>
        </div>
      </td>

      {/* 3. Linked Player Profile */}
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

      {/* 4. Status Pill Toggle */}
      <td>
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
      </td>

      {/* 5. Role Management Action Dropdown & Delete */}
      <td style={{ textAlign: 'right' }}>
        <div className="admin-role-action-cell">
          <RoleSelectDropdown
            currentRole={u.role}
            onChange={(newRole) => onUpdateRole(u._id, newRole)}
            disabled={isRolePending || isSuperAdmin}
            align="right"
            openUpward={isFirstOrLastRow}
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
      </td>
    </tr>
  );
};
