"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Check,
  Shield,
  ShieldCheck,
  User,
  SlidersHorizontal,
  Crown,
  Lock,
} from "lucide-react";
import styles from "./RoleSelectDropdown.module.css";

export type UserRoleType = "captain" | "viewer" | "treasurer" | "admin" | "super_admin";

export interface RoleConfig {
  value: UserRoleType;
  label: string;
  tag: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ElementType;
}

export const ROLE_CONFIGS: Record<UserRoleType, RoleConfig> = {
  admin: {
    value: "admin",
    label: "Admin",
    tag: "Operations",
    description: "System administration and operational management",
    color: "#ea580c",
    bgColor: "#fff7ed",
    borderColor: "#fed7aa",
    icon: ShieldCheck,
  },
  captain: {
    value: "captain",
    label: "Team Captain",
    tag: "Squad Lead",
    description: "Full squad, match scorecards & ledger control",
    color: "#0284c7",
    bgColor: "#f0f9ff",
    borderColor: "#bae6fd",
    icon: Shield,
  },
  viewer: {
    value: "viewer",
    label: "Normal Player",
    tag: "Player",
    description: "Personal dues balance, scorecard & match viewer",
    color: "#16a34a",
    bgColor: "#f0fdf4",
    borderColor: "#bbf7d0",
    icon: User,
  },
  treasurer: {
    value: "treasurer",
    label: "Treasurer",
    tag: "Finances",
    description: "Financial ledger, dues & expense tracking",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fde68a",
    icon: SlidersHorizontal,
  },
  super_admin: {
    value: "super_admin",
    label: "Super Admin",
    tag: "Full Control",
    description: "Unrestricted administrative platform access",
    color: "#7c3aed",
    bgColor: "#faf5ff",
    borderColor: "#e9d5ff",
    icon: Crown,
  },
};

export const ROLE_LIST: RoleConfig[] = [
  ROLE_CONFIGS.admin,
  ROLE_CONFIGS.captain,
  ROLE_CONFIGS.viewer,
  ROLE_CONFIGS.treasurer,
  ROLE_CONFIGS.super_admin,
];

interface RoleSelectDropdownProps {
  currentRole: UserRoleType | string;
  onChange: (newRole: UserRoleType) => void;
  disabled?: boolean;
  align?: "left" | "right";
  openUpward?: boolean;
}

export const RoleSelectDropdown: React.FC<RoleSelectDropdownProps> = ({
  currentRole,
  onChange,
  disabled = false,
  align = "right",
  openUpward = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; isUpward: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selectedRoleConfig: RoleConfig =
    ROLE_CONFIGS[currentRole as UserRoleType] || ROLE_CONFIGS.viewer;
  const TriggerIcon = selectedRoleConfig.icon;
  const isSuperAdminLocked = disabled && currentRole === "super_admin";

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateMenuPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = 326;
    const menuHeight = 360;
    const gap = 6;

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Smart vertical flip: if requested or if below is too tight and above has more room
    const isUpward = openUpward || (spaceBelow < menuHeight && spaceAbove > spaceBelow);

    const top = isUpward
      ? Math.max(10, rect.top - menuHeight - gap)
      : Math.min(window.innerHeight - menuHeight - 10, rect.bottom + gap);

    let left = align === "right" ? rect.right - menuWidth : rect.left;
    if (left + menuWidth > window.innerWidth - 12) {
      left = window.innerWidth - menuWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    setMenuCoords({ top, left, isUpward });
  };

  useEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();

    const handleScrollOrResize = () => {
      updateMenuPosition();
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isOpen, openUpward, align]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (roleValue: UserRoleType) => {
    if (disabled) return;
    setIsOpen(false);
    if (roleValue !== currentRole) {
      onChange(roleValue);
    }
  };

  const menuDropdown = isOpen && menuCoords && (
    <div
      ref={menuRef}
      className={styles.menuPortal}
      style={{
        top: `${menuCoords.top}px`,
        left: `${menuCoords.left}px`,
      }}
      role="listbox"
    >
      {/* Header */}
      <div className={styles.menuHeader}>
        <div className={styles.menuHeaderTitleRow}>
          <Shield size={12} className={styles.menuHeaderIcon} />
          <span className={styles.menuHeaderTitle}>Select System Role</span>
        </div>
        <span className={styles.menuHeaderBadge}>{ROLE_LIST.length} Roles</span>
      </div>

      {/* Role Items List */}
      <div className={styles.menuList}>
        {ROLE_LIST.map((role) => {
          const isSelected = role.value === currentRole;
          const ItemIcon = role.icon;

          return (
            <button
              key={role.value}
              type="button"
              className={`${styles.roleItem} ${isSelected ? styles.selected : ""}`}
              onClick={() => handleSelect(role.value)}
              role="option"
              aria-selected={isSelected}
            >
              {/* Left Rich Icon Box */}
              <div
                className={styles.itemIconBox}
                style={{
                  backgroundColor: role.bgColor,
                  color: role.color,
                  borderColor: role.borderColor,
                }}
              >
                <ItemIcon size={16} strokeWidth={2.4} />
              </div>

              {/* Center Details */}
              <div className={styles.itemBody}>
                <div className={styles.itemTitleRow}>
                  <span className={styles.itemTitle}>{role.label}</span>
                  <span
                    className={styles.itemTag}
                    style={{
                      backgroundColor: role.bgColor,
                      color: role.color,
                      border: `1px solid ${role.borderColor}`,
                    }}
                  >
                    {role.tag}
                  </span>
                </div>
                <p className={styles.itemDesc}>{role.description}</p>
              </div>

              {/* Right Active Indicator or Hover Arrow */}
              {isSelected ? (
                <div className={styles.itemCheckPill} title="Currently Selected">
                  <Check size={12} strokeWidth={3} />
                </div>
              ) : (
                <ChevronRight size={13} className={styles.itemArrowIcon} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`${styles.container} ${isOpen ? "is-open" : ""}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        className={`${styles.trigger} ${styles[selectedRoleConfig.value] || ""} ${
          isOpen ? styles.activeOpen : ""
        }`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={
          isSuperAdminLocked
            ? "Super Admin role is locked and protected"
            : disabled
            ? "Role selection disabled"
            : "Click to change user role"
        }
      >
        <span
          className={styles.triggerIconBox}
          style={{
            backgroundColor: selectedRoleConfig.bgColor,
            color: selectedRoleConfig.color,
          }}
        >
          <TriggerIcon size={12} strokeWidth={2.5} />
        </span>

        <span className={styles.triggerLabel}>{selectedRoleConfig.label}</span>

        {isSuperAdminLocked ? (
          <Lock size={12} className={styles.lockIcon} />
        ) : (
          <ChevronDown
            size={12}
            className={`${styles.chevron} ${isOpen ? styles.rotated : ""}`}
          />
        )}
      </button>

      {/* Render Menu via Portal directly into document.body to prevent clipping */}
      {mounted && typeof document !== "undefined"
        ? createPortal(menuDropdown, document.body)
        : menuDropdown}
    </div>
  );
};
