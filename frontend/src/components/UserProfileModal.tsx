'use client';

import React from 'react';
import { Modal } from './Modal';
import { UserSession } from '../lib/auth';
import {
  User as UserIcon,
  Phone,
  Mail,
  Shield,
  Building2,
  Calendar,
  CheckCircle2,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSession | null;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogout,
}) => {
  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'CP';

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Administrator',
    captain: 'Team Captain',
    treasurer: 'Team Treasurer',
    viewer: 'Player / Viewer',
  };

  const roleName = roleLabels[user.role] || user.role.replace('_', ' ');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      subtitle="Account details and team permissions"
      maxWidth="540px"
      footer={
        <>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            id="profile-modal-logout-btn"
            className="btn btn-danger btn-sm"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            <LogOut size={13} />
            <span>Log Out</span>
          </button>
        </>
      }
    >
      <div className="profile-modal-body">
        {/* Banner with Avatar */}
        <div className="profile-banner">
          <div className="profile-avatar-large">
            <span>{initials}</span>
            <span className="profile-status-indicator" title="Active & Online" />
          </div>
          <div className="profile-main-info">
            <h3 className="profile-name">{user.name}</h3>
            <div className="profile-badges-row">
              <span className="badge badge-success">
                <Shield size={11} />
                <span>{roleName}</span>
              </span>
              <span className="badge badge-primary">
                <Building2 size={11} />
                <span>Gulzar Cricket Club</span>
              </span>
              <span className="badge badge-purple">
                <Sparkles size={11} />
                <span>Squad Player #04</span>
              </span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <div className="profile-info-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Phone size={16} />
            </div>
            <div>
              <span className="profile-info-label">Phone Number</span>
              <span className="profile-info-value">{user.phone || '0342-2181946'}</span>
              <span className="profile-info-sub">Registered Player & Login Number</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
              <Mail size={16} />
            </div>
            <div>
              <span className="profile-info-label">Email Address</span>
              <span className="profile-info-value">{user.email}</span>
              <span className="profile-info-sub">Primary Notifications</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
              <Shield size={16} />
            </div>
            <div>
              <span className="profile-info-label">Squad Profile</span>
              <span className="profile-info-value">Jersey #04 · All-Rounder</span>
              <span className="profile-info-sub">Right-hand bat · Right-arm medium</span>
            </div>
          </div>

          <div className="profile-info-card">
            <div className="profile-info-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
              <Sparkles size={16} />
            </div>
            <div>
              <span className="profile-info-label">Session Security</span>
              <span className="profile-info-value">JWT Authenticated</span>
              <span className="profile-info-sub">30-day active session</span>
            </div>
          </div>
        </div>

        {/* Permissions list */}
        <div className="profile-permissions-box">
          <h4 className="profile-section-title">
            <CheckCircle2 size={15} color="#059669" />
            <span>Authorized Captain Capabilities</span>
          </h4>
          <ul className="profile-permissions-list">
            <li>
              <span className="perm-dot" />
              <span>Manage Players & match fees ledger (Paid/Unpaid/Pending)</span>
            </li>
            <li>
              <span className="perm-dot" />
              <span>Create matches, record lineups, scorecards & player stats</span>
            </li>
            <li>
              <span className="perm-dot" />
              <span>Track team tournament ROI, entry fees & prize rewards</span>
            </li>
            <li>
              <span className="perm-dot" />
              <span>Log sponsor transactions, kits, and operational expenditures</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};
