'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { fetchApi } from '../lib/api';
import { useAuth } from '../lib/auth';
import { PlayerReturnModal } from '../components/PlayerReturnModal';
import { UserRoleManagement } from '../components/UserRoleManagement';
import { DashboardWidgetSkeleton } from '../components/ui/Skeleton';

// Reusable Dashboard Subcomponents
import {
  WidgetKey,
  WidgetSelections,
  AutosaveStatus,
  WIDGET_STORAGE_KEY,
  WIDGET_SELECTIONS_KEY,
  MiniStatsGrid,
  WidgetToolbar,
  EmptyWidgetSelector,
  PlayerWidgetCard,
  TournamentWidgetCard,
  TeamWidgetCard,
  SponsorWidgetCard,
  SuperAdminTabSwitch,
} from '../components/dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [teamId, setTeamId] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'overview' | 'users'>('overview');

  // Return/Refund Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnTargetPlayer, setReturnTargetPlayer] = useState<any>(null);

  // Dynamic selected widgets: Initially empty per user request or restored from localStorage
  const [selectedWidgets, setSelectedWidgets] = useState<WidgetKey[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(WIDGET_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved dashboard widgets', e);
      }
    }
    return [];
  });

  // Individual entity selection inside widgets (Player / Tournament / Team / Sponsor)
  const [widgetSelections, setWidgetSelections] = useState<WidgetSelections>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(WIDGET_SELECTIONS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            playerId: parsed.playerId || 'all',
            tournamentId: parsed.tournamentId || 'all',
            teamId: parsed.teamId || 'all',
            sponsorId: parsed.sponsorId || 'all',
          };
        }
      } catch (e) {}
    }
    return {
      playerId: 'all',
      tournamentId: 'all',
      teamId: 'all',
      sponsorId: 'all',
    };
  });

  // Autosave status indicator
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const autosaveTimeoutRef = useRef<any>(null);

  // Autosave function that persists to both localStorage and MongoDB backend API
  const performAutosave = async (
    newWidgets: WidgetKey[],
    newSelections: WidgetSelections
  ) => {
    setAutosaveStatus('saving');

    // 1. Immediately save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(newWidgets));
        localStorage.setItem(WIDGET_SELECTIONS_KEY, JSON.stringify(newSelections));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }

    // 2. Persist to MongoDB backend user preferences
    try {
      await fetchApi<{ success: boolean }>('/auth/dashboard-settings', {
        method: 'PUT',
        body: JSON.stringify({
          widgets: newWidgets,
          selections: newSelections,
        }),
      });
    } catch (e) {
      // Backend silent fallback if offline
    }

    setAutosaveStatus('saved');
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );

    if (autosaveTimeoutRef.current) clearTimeout(autosaveTimeoutRef.current);
    autosaveTimeoutRef.current = setTimeout(() => {
      setAutosaveStatus('idle');
    }, 3500);
  };

  // Sync widget configuration to localStorage and backend
  const updateWidgets = (newWidgets: WidgetKey[]) => {
    setSelectedWidgets(newWidgets);
    performAutosave(newWidgets, widgetSelections);
  };

  // Sync individual widget selections to localStorage and backend
  const updateSelection = (key: keyof WidgetSelections, value: string) => {
    const updated = { ...widgetSelections, [key]: value };
    setWidgetSelections(updated);
    performAutosave(selectedWidgets, updated);
  };

  const toggleWidget = (widgetKey: WidgetKey) => {
    if (selectedWidgets.includes(widgetKey)) {
      updateWidgets(selectedWidgets.filter((w) => w !== widgetKey));
    } else {
      updateWidgets([...selectedWidgets, widgetKey]);
    }
  };

  const addAllWidgets = () => {
    updateWidgets(['players', 'tournaments', 'teams', 'sponsors']);
  };

  const clearAllWidgets = () => {
    updateWidgets([]);
  };

  const queryClient = useQueryClient();
  const query = teamId ? `?teamId=${teamId}` : '';

  const {
    data: statsRes,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard', 'stats', teamId],
    queryFn: () =>
      fetchApi<{
        success: boolean;
        summary: any;
        finances: any;
        recentMatches: any[];
        topDebtors: any[];
      }>(`/dashboard/stats${query}`),
  });

  const { data: playersRes } = useQuery({
    queryKey: ['players', { teamId }],
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>(`/players${query}`),
  });

  const { data: tournRes } = useQuery({
    queryKey: ['tournaments', { teamId }],
    queryFn: () => fetchApi<{ success: boolean; tournaments: any[] }>(`/tournaments${query}`),
  });

  const { data: teamsRes } = useQuery({
    queryKey: ['teams'],
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const { data: sponsRes } = useQuery({
    queryKey: ['sponsors', { teamId }],
    queryFn: () => fetchApi<{ success: boolean; sponsors: any[] }>(`/sponsors${query}`),
  });

  const { data: meRes } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => fetchApi<{ success: boolean; user: any }>('/auth/me'),
  });

  const stats = statsRes?.success ? statsRes : null;
  const playersList = playersRes?.success && playersRes.players ? playersRes.players : [];
  const tournamentsList = tournRes?.success && tournRes.tournaments ? tournRes.tournaments : [];
  const teamsList = teamsRes?.success && teamsRes.teams ? teamsRes.teams : [];
  const sponsorsList = sponsRes?.success && sponsRes.sponsors ? sponsRes.sponsors : [];

  useEffect(() => {
    if (meRes?.success && meRes.user?.dashboardSettings) {
      const dbSettings = meRes.user.dashboardSettings;
      if (Array.isArray(dbSettings.widgets) && dbSettings.widgets.length > 0) {
        setSelectedWidgets(dbSettings.widgets);
      }
      if (dbSettings.selections) {
        setWidgetSelections((prev) => ({
          playerId: dbSettings.selections.playerId || prev.playerId,
          tournamentId: dbSettings.selections.tournamentId || prev.tournamentId,
          teamId: dbSettings.selections.teamId || prev.teamId,
          sponsorId: dbSettings.selections.sponsorId || prev.sponsorId,
        }));
      }
    }
  }, [meRes]);

  const loadData = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    refetchStats();
  };

  // Find currently selected individual entities
  const selectedIndividualPlayer = useMemo(() => {
    if (widgetSelections.playerId === 'all') return null;
    return playersList.find((p) => p._id === widgetSelections.playerId) || null;
  }, [widgetSelections.playerId, playersList]);

  const selectedIndividualTournament = useMemo(() => {
    if (widgetSelections.tournamentId === 'all') return null;
    return tournamentsList.find((t) => t._id === widgetSelections.tournamentId) || null;
  }, [widgetSelections.tournamentId, tournamentsList]);

  const selectedIndividualTeam = useMemo(() => {
    if (widgetSelections.teamId === 'all') return null;
    return teamsList.find((tm) => tm._id === widgetSelections.teamId) || null;
  }, [widgetSelections.teamId, teamsList]);

  const selectedIndividualSponsor = useMemo(() => {
    if (widgetSelections.sponsorId === 'all') return null;
    return sponsorsList.find((s) => s._id === widgetSelections.sponsorId) || null;
  }, [widgetSelections.sponsorId, sponsorsList]);

  const isSuperAdmin = (authUser?.role || meRes?.user?.role) === 'super_admin';

  return (
    <>
      <Header
        title={
          adminTab === 'users' && isSuperAdmin
            ? 'Super Admin Directory & Role Management'
            : "Captain's Command Center"
        }
        subtitle={
          adminTab === 'users' && isSuperAdmin
            ? 'Manage all platform accounts, designate Team Captains or Normal Players, and control system roles'
            : 'Dynamic Personalized Dashboard with Individual Player, Tournament & Team Selection'
        }
        selectedTeamId={teamId}
        onTeamChange={setTeamId}
      />

      <div className="content-body" style={{ padding: '14px 24px 28px 24px' }}>
        {/* Super Admin Dashboard Navigation Tabs */}
        {isSuperAdmin && (
          <SuperAdminTabSwitch
            adminTab={adminTab}
            onTabChange={setAdminTab}
          />
        )}

        {/* Tab 1: User & Role Management View (Super Admin Only) */}
        {adminTab === 'users' && isSuperAdmin ? (
          <UserRoleManagement />
        ) : (
          <>
            {/* Top 4 Financial Metric Boxes */}
            <MiniStatsGrid stats={stats} isLoading={isStatsLoading} />

            {/* Dynamic Widget Selector Toolbar */}
            <WidgetToolbar
              selectedWidgets={selectedWidgets}
              autosaveStatus={autosaveStatus}
              lastSavedTime={lastSavedTime}
              onToggleWidget={toggleWidget}
              onAddAllWidgets={addAllWidgets}
              onClearAllWidgets={clearAllWidgets}
            />

            {/* Dashboard Content: Skeleton Loaders or Widgets */}
            {isStatsLoading && !stats ? (
              <div className="grid-2">
                <DashboardWidgetSkeleton count={Math.max(selectedWidgets.length, 2)} />
              </div>
            ) : selectedWidgets.length === 0 ? (
              /* State 1: Empty Dashboard State */
              <EmptyWidgetSelector
                onToggleWidget={toggleWidget}
                onAddAllWidgets={addAllWidgets}
              />
            ) : (
              /* State 2: Dynamic Active Widgets Grid */
              <div className="grid-2">
                {/* Widget 1: Player Squad & Dues */}
                {selectedWidgets.includes('players') && (
                  <PlayerWidgetCard
                    playersList={playersList}
                    selectedPlayerId={widgetSelections.playerId}
                    selectedPlayer={selectedIndividualPlayer}
                    stats={stats}
                    onSelectPlayer={(id) => updateSelection('playerId', id)}
                    onRemove={() => toggleWidget('players')}
                    onOpenReturnModal={(player) => {
                      setReturnTargetPlayer(player);
                      setIsReturnModalOpen(true);
                    }}
                  />
                )}

                {/* Widget 2: Tournament & Leagues */}
                {selectedWidgets.includes('tournaments') && (
                  <TournamentWidgetCard
                    tournamentsList={tournamentsList}
                    selectedTournamentId={widgetSelections.tournamentId}
                    selectedTournament={selectedIndividualTournament}
                    stats={stats}
                    onSelectTournament={(id) => updateSelection('tournamentId', id)}
                    onRemove={() => toggleWidget('tournaments')}
                  />
                )}

                {/* Widget 3: Club Teams & Squads */}
                {selectedWidgets.includes('teams') && (
                  <TeamWidgetCard
                    teamsList={teamsList}
                    selectedTeamId={widgetSelections.teamId}
                    selectedTeam={selectedIndividualTeam}
                    stats={stats}
                    onSelectTeam={(id) => updateSelection('teamId', id)}
                    onRemove={() => toggleWidget('teams')}
                  />
                )}

                {/* Widget 4: Brand Sponsors & Grants */}
                {selectedWidgets.includes('sponsors') && (
                  <SponsorWidgetCard
                    sponsorsList={sponsorsList}
                    selectedSponsorId={widgetSelections.sponsorId}
                    selectedSponsor={selectedIndividualSponsor}
                    stats={stats}
                    onSelectSponsor={(id) => updateSelection('sponsorId', id)}
                    onRemove={() => toggleWidget('sponsors')}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal for returning fee / prize share / sponsor payout to player */}
      <PlayerReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => {
          setIsReturnModalOpen(false);
          setReturnTargetPlayer(null);
        }}
        player={returnTargetPlayer}
        tournaments={tournamentsList}
        onSuccess={loadData}
      />
    </>
  );
}
