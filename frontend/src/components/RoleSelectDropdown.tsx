'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  User,
  Crown,
  SlidersHorizontal,
  ChevronDown,
  Check,
} from 'lucide-react';

export type UserRoleType = 'captain' | 'viewer' | 'treasurer' | 'super_admin';

export interface RoleConfig {
  value: UserRoleType;
  label: string;
  tag: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  tagBg: string;
  tagColor: string;
}

export const ROLE_CONFIGS: Record<UserRoleType, RoleConfig> = {
  captain: {
    value: 'captain',
    label: 'Team Captain',
    tag: 'Captain Access',
    description: 'Full squad, match scorecards & ledger control',
    icon: Shield,
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    tagBg: '#e0f2fe',
    tagColor: '#0369a1',
  },
  viewer: {
    value: 'viewer',
    label: 'Normal Player',
    tag: 'Player View',
    description: 'Personal dues balance, scorecard & match viewer',
    icon: User,
    color: '#16a34a',
    bgColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    tagBg: '#dcfce7',
    tagColor: '#15803d',
  },
  treasurer: {
    value: 'treasurer',
    label: 'Treasurer',
    tag: 'Finance Desk',
    description: 'Financial ledger, dues & expense tracking',
    icon: SlidersHorizontal,
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    tagBg: '#fef3c7',
    tagColor: '#b45309',
  },
  super_admin: {
    value: 'super_admin',
    label: 'Super Admin',
    tag: 'Master Control',
    description: 'Unrestricted administrative platform access',
    icon: Crown,
    color: '#7c3aed',
    bgColor: '#faf5ff',
    borderColor: '#e9d5ff',
    tagBg: '#f3e8ff',
    tagColor: '#6b21a8',
  },
};

export const ROLE_LIST: RoleConfig[] = [
  ROLE_CONFIGS.captain,
  ROLE_CONFIGS.viewer,
  ROLE_CONFIGS.treasurer,
  ROLE_CONFIGS.super_admin,
];

interface RoleSelectDropdownProps {
  currentRole: UserRoleType | string;
  onChange: (newRole: UserRoleType) => void;
  disabled?: boolean;
  align?: 'left' | 'right';
  openUpward?: boolean;
}

export const RoleSelectDropdown: React.FC<RoleSelectDropdownProps> = ({
  currentRole,
  onChange,
  disabled = false,
  align = 'right',
  openUpward = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedRoleConfig: RoleConfig =
    ROLE_CONFIGS[currentRole as UserRoleType] || ROLE_CONFIGS.viewer;
  const TriggerIcon = selectedRoleConfig.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (roleValue: UserRoleType) => {
    if (disabled) return;
    setIsOpen(false);
    if (roleValue !== currentRole) {
      onChange(roleValue);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-role-dropdown-container ${isOpen ? 'is-open' : ''}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`custom-role-trigger ${selectedRoleConfig.value} ${
          isOpen ? 'active-open' : ''
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title="Click to change user role"
      >
        <span
          className="custom-role-trigger-icon"
          style={{
            backgroundColor: selectedRoleConfig.bgColor,
            color: selectedRoleConfig.color,
            borderColor: selectedRoleConfig.borderColor,
          }}
        >
          <TriggerIcon size={12} strokeWidth={2.5} />
        </span>

        <span className="custom-role-trigger-label">
          {selectedRoleConfig.label}
        </span>

        <ChevronDown
          size={12}
          className={`custom-role-chevron ${isOpen ? 'rotated' : ''}`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className={`custom-role-menu align-${align} ${
            openUpward ? 'open-upward' : 'open-downward'
          }`}
          role="listbox"
        >
          <div className="custom-role-menu-header">
            <span>Select System Role</span>
          </div>

          <div className="custom-role-menu-list">
            {ROLE_LIST.map((role) => {
              const RoleIcon = role.icon;
              const isSelected = role.value === currentRole;

              return (
                <button
                  key={role.value}
                  type="button"
                  className={`custom-role-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(role.value)}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* Left Icon */}
                  <div
                    className="custom-role-item-icon-box"
                    style={{
                      backgroundColor: role.bgColor,
                      color: role.color,
                      borderColor: role.borderColor,
                    }}
                  >
                    <RoleIcon size={14} strokeWidth={2.5} />
                  </div>

                  {/* Text details */}
                  <div className="custom-role-item-body">
                    <div className="custom-role-item-title-row">
                      <span className="custom-role-item-title">
                        {role.label}
                      </span>
                      <span
                        className="custom-role-item-tag"
                        style={{
                          backgroundColor: role.tagBg,
                          color: role.tagColor,
                        }}
                      >
                        {role.tag}
                      </span>
                    </div>
                    <span className="custom-role-item-desc">
                      {role.description}
                    </span>
                  </div>

                  {/* Active Check Indicator */}
                  {isSelected && (
                    <div className="custom-role-item-check">
                      <Check size={14} strokeWidth={2.5} color="#0284c7" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
