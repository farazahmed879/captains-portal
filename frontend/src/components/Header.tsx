"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "../lib/api";
import { useAuth } from "../lib/auth";
import { PlusCircleIcon } from "./icons";
import { Button } from "./ui";
import { TopbarBrand, TopbarTeamPicker, TopbarUserMenu } from "./topbar";
import { UserProfileModal } from "./UserProfileModal";

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
  const router = useRouter();
  const [teams, setTeams] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();

  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    fetchApi<{ success: boolean; teams: any[] }>("/teams")
      .then((res) => {
        if (res.success) {
          setTeams(res.teams);
        }
      })
      .catch((err) => console.log("Could not load teams", err));
  }, []);

  // Teams that belong to the logged-in captain or player (except for superadmin who sees all)
  const userTeams = useMemo(() => {
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
        (ptid: any) => (ptid._id || ptid.id || ptid) === (t.id || t._id),
      );

      return hasPlayerTeam;
    });
  }, [teams, user, isSuperAdmin]);

  // For captains & players: auto-select their assigned team if no valid team is currently selected
  useEffect(() => {
    if (!isSuperAdmin && onTeamChange && userTeams.length > 0) {
      const isCurrentValid = userTeams.some(
        (t) => (t.id || t._id) === selectedTeamId,
      );
      if (!isCurrentValid) {
        onTeamChange(userTeams[0].id || userTeams[0]._id);
      }
    }
  }, [isSuperAdmin, userTeams, selectedTeamId, onTeamChange]);

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <TopbarBrand />

          <div className="topbar-heading">
            <h1 className="topbar-title">{title}</h1>
          </div>
        </div>

        <div className="topbar-actions">
          {/* Reusable Team Selector Picker */}
          {onTeamChange && (
            <TopbarTeamPicker
              selectedTeamId={selectedTeamId}
              onTeamChange={onTeamChange}
              teams={userTeams}
              isSuperAdmin={isSuperAdmin}
            />
          )}

          <TopbarUserMenu
            isAuthenticated={isAuthenticated}
            user={user}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={logout}
          />
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
