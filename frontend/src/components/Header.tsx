'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PlusCircleIcon, ShieldIcon } from './icons';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface HeaderProps {
  title: string;
  subtitle?: string;
  selectedTeamId?: string;
  onTeamChange?: (teamId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  selectedTeamId,
  onTeamChange,
}) => {
  const [teams, setTeams] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    fetchApi<{ success: boolean; teams: any[] }>('/teams')
      .then((res) => {
        if (res.success) {
          setTeams(res.teams);
        }
      })
      .catch((err) => console.log('Could not load teams', err));
  }, []);

  return (
    <>
      <header className="topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            href="/"
            className="header-brand"
            title="Go to Dashboard"
            aria-label="Captains Portal Dashboard"
          >
            <div className="header-brand-icon">CP</div>
            <div className="header-brand-text">
              <span className="header-brand-title">CAPTAINS</span>
              <span className="header-brand-sub">Sports Pro</span>
            </div>
          </Link>

          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.025em', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Team Selector */}
          {onTeamChange && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldIcon size={16} color="var(--accent-blue)" />
              <select
                className="form-select"
                style={{ width: '180px', padding: '6px 10px', fontSize: '13px' }}
                value={selectedTeamId || ''}
                onChange={(e) => onTeamChange(e.target.value)}
              >
                <option value="">All Teams (Global)</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Link href="/matches" className="btn btn-primary btn-sm">
            <PlusCircleIcon size={14} />
            <span>New Match</span>
          </Link>
          <Link href="/finances" className="btn btn-secondary btn-sm">
            <PlusCircleIcon size={14} />
            <span>Add Expense</span>
          </Link>

          {/* User Session & Logout */}
          {isAuthenticated ? (
            <div className="header-user-pill">
              <button
                type="button"
                className="header-user-btn"
                onClick={() => setIsProfileOpen(true)}
                title="Click to view your profile"
                id="header-user-profile-btn"
              >
                <div className="header-user-avatar">
                  <UserIcon size={14} />
                </div>
                <div className="header-user-meta">
                  <span className="header-user-name">{user?.name || 'Faraz (Captain)'}</span>
                  <span className="header-user-role">{user?.role?.replace('_', ' ') || 'Super Admin'}</span>
                </div>
              </button>

              <button
                type="button"
                id="header-logout-btn"
                onClick={logout}
                className="header-logout-btn"
                title="Log out of Captains Portal"
                aria-label="Logout"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              id="header-login-btn"
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              <LogIn size={13} />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onLogout={logout}
      />
    </>
  );
};
