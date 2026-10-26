import React from 'react';
import { X, Shield, ShieldCheck, User, Crown } from 'lucide-react';
import { Button } from '../ui';
import { RoleFilterType, UserCounts } from './types';

export interface UserRoleToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  roleFilter: RoleFilterType;
  onFilterChange: (filter: RoleFilterType) => void;
  counts: UserCounts;
}

export const UserRoleToolbar: React.FC<UserRoleToolbarProps> = ({
  searchTerm,
  onSearchChange,
  roleFilter,
  onFilterChange,
  counts,
}) => {
  return (
    <div className="admin-table-toolbar">
      {/* Search Box */}
      <div className="admin-search-box">
        <input
          type="text"
          className="admin-search-input"
          placeholder="Search users by name, phone, or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            className="admin-search-clear"
            onClick={() => onSearchChange('')}
            title="Clear search"
            icon={<X size={13} />}
          />
        )}
      </div>

      {/* Role Filter Pills */}
      <div className="admin-filter-pills">
        <Button
          className={`admin-filter-pill ${roleFilter === 'all' ? 'active' : ''}`}
          onClick={() => onFilterChange('all')}
        >
          <span>All Users ({counts.total})</span>
        </Button>

        <Button
          className={`admin-filter-pill captains ${roleFilter === 'captains' ? 'active' : ''}`}
          onClick={() => onFilterChange('captains')}
          icon={<Shield size={12} />}
        >
          <span>Captains ({counts.captains})</span>
        </Button>

        <Button
          className={`admin-filter-pill players ${roleFilter === 'players' ? 'active' : ''}`}
          onClick={() => onFilterChange('players')}
          icon={<User size={12} />}
        >
          <span>Normal Players ({counts.normalPlayers})</span>
        </Button>

        <Button
          className={`admin-filter-pill admins ${roleFilter === 'admins' ? 'active' : ''}`}
          onClick={() => onFilterChange('admins')}
          icon={<ShieldCheck size={12} />}
        >
          <span>Admins ({counts.admins || 0})</span>
        </Button>

        <Button
          className={`admin-filter-pill super_admins ${roleFilter === 'super_admins' ? 'active' : ''}`}
          onClick={() => onFilterChange('super_admins')}
          icon={<Crown size={12} />}
        >
          <span>Super Admins ({counts.superAdmins})</span>
        </Button>
      </div>
    </div>
  );
};
