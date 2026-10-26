import React from 'react';
import { Users, Shield, ShieldCheck, Crown, User } from 'lucide-react';
import { RoleFilterType, UserCounts } from './types';

export interface UserRoleStatsProps {
  counts: UserCounts;
  roleFilter: RoleFilterType;
  onFilterChange: (filter: RoleFilterType) => void;
}

export const UserRoleStats: React.FC<UserRoleStatsProps> = ({
  counts,
  roleFilter,
  onFilterChange,
}) => {
  return (
    <div className="admin-stats-grid">
      <div
        className={`admin-stat-card total ${roleFilter === 'all' ? 'selected' : ''}`}
        onClick={() => onFilterChange('all')}
        role="button"
        tabIndex={0}
      >
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
        onClick={() => onFilterChange(roleFilter === 'captains' ? 'all' : 'captains')}
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
        onClick={() => onFilterChange(roleFilter === 'players' ? 'all' : 'players')}
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
        className={`admin-stat-card admin ${roleFilter === 'admins' ? 'selected' : ''}`}
        onClick={() => onFilterChange(roleFilter === 'admins' ? 'all' : 'admins')}
        role="button"
        tabIndex={0}
      >
        <div className="admin-stat-icon admin">
          <ShieldCheck size={18} />
        </div>
        <div className="admin-stat-content">
          <span className="admin-stat-number">{counts.admins || 0}</span>
          <span className="admin-stat-label">Admins</span>
        </div>
      </div>

      <div
        className={`admin-stat-card admins ${roleFilter === 'super_admins' ? 'selected' : ''}`}
        onClick={() => onFilterChange(roleFilter === 'super_admins' ? 'all' : 'super_admins')}
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
  );
};
