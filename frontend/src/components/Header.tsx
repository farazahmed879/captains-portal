'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PlusCircleIcon, ShieldIcon } from './icons';
import { LogOut, LogIn, User as UserIcon } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';
import { ASSETS } from '../constants';

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

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchApi<{ success: boolean; teams: any[] }>('/teams')
      .then((res) => {
        if (res.success) {
          setTeams(res.teams);
        }
      })
      .catch((err) => console.log('Could not load teams', err));
  }, []);

  // Teams that belong to the logged-in captain or player (except for superadmin who sees all)
  const userTeams = React.useMemo(() => {
    if (isSuperAdmin) return teams;
    if (!user) return [];

    return teams.filter((t) => {
      // 1. User is the captain of this team
      const isCaptain =
        t.captainId === user.id ||
        t.captainId?._id === user.id ||
        t.captainId === (user as any)._id ||
        t.captainId?._id === (user as any)._id;

      if (isCaptain) return true;

      // 2. User is linked as player to this team
      const playerTeamIds = (user.player as any)?.teamIds || [];
      const hasPlayerTeam = playerTeamIds.some(
        (ptid: any) => (ptid._id || ptid.id || ptid) === (t.id || t._id)
      );

      return hasPlayerTeam;
    });
  }, [teams, user, isSuperAdmin]);

  // For captains & players: auto-select their assigned team if no valid team is currently selected
  useEffect(() => {
    if (!isSuperAdmin && onTeamChange && userTeams.length > 0) {
      const isCurrentValid = userTeams.some((t) => (t.id || t._id) === selectedTeamId);
      if (!isCurrentValid) {
        onTeamChange(userTeams[0].id || userTeams[0]._id);
      }
    }
  }, [isSuperAdmin, userTeams, selectedTeamId, onTeamChange]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <Link
            href="/"
            className="header-brand"
            title="Go to Dashboard"
            aria-label="Captains Portal Dashboard"
          >
            <div className="header-brand-icon">
              <img
                src={ASSETS.LOGO}
                alt="Captains Portal Logo"
                className="header-brand-img"
              />
            </div>
            <div className="header-brand-text">
              <span className="header-brand-title">CAPTAINS</span>
              <span className="header-brand-sub">Sports Pro</span>
            </div>
          </Link>

          <div className="topbar-heading">
            <h1 className="topbar-title">
              {title}
            </h1>
            {subtitle && (
              <p className="topbar-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="topbar-actions">
          {/* Team Selector - Shows only user's team for captains/players, except superadmin */}
          {onTeamChange && (
            <div
              className="topbar-team-picker"
              title={isSuperAdmin ? 'Global Team Selector (Super Admin)' : 'Your Assigned Team'}
            >
              <ShieldIcon size={16} color="var(--accent-blue)" />
              <select
                className="form-select topbar-team-select"
                value={selectedTeamId || ''}
                onChange={(e) => onTeamChange(e.target.value)}
              >
                {/* Only Super Admin can view All Teams (Global) */}
                {isSuperAdmin && <option value="">All Teams (Global)</option>}

                {userTeams.length === 0 && !isSuperAdmin ? (
                  <option value="" disabled>
                    No Team Assigned
                  </option>
                ) : (
                  userTeams.map((t) => {
                    const tid = t.id || t._id;
                    return (
                      <option key={tid} value={tid}>
                        {t.name}
                      </option>
                    );
                  })
                )}
              </select>
            </div>
          )}

          <Link href="/matches" className="btn btn-primary btn-sm topbar-quick-btn" title="New Match" aria-label="New Match">
            <PlusCircleIcon size={14} />
            <span className="btn-label">New Match</span>
          </Link>
          <Link href="/finances" className="btn btn-secondary btn-sm topbar-quick-btn" title="Add Expense" aria-label="Add Expense">
            <PlusCircleIcon size={14} />
            <span className="btn-label">Add Expense</span>
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
                <span className="btn-label">Logout</span>
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
