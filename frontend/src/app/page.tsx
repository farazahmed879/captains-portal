'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '../components/Header';
import { Button, Badge } from '../components/ui';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import {
  TrendingUpIcon,
  DollarIcon,
  TrophyIcon,
  UsersIcon,
  ShieldIcon,
  HandshakeIcon,
  CheckCircleIcon,
  PlusIcon,
  CloseIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  ChevronRightIcon,
  MapPinIcon,
  PhoneIcon,
  JerseyIcon,
  ClockIcon,
} from '../components/icons';
import { PlayerReturnModal } from '../components/PlayerReturnModal';
import { UserRoleManagement } from '../components/UserRoleManagement';
import { useAuth } from '../lib/auth';

type WidgetKey = 'players' | 'tournaments' | 'teams' | 'sponsors';

const WIDGET_STORAGE_KEY = 'captains_portal_dashboard_widgets';
const WIDGET_SELECTIONS_KEY = 'captains_portal_dashboard_selections';

export default function DashboardPage() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [teamId, setTeamId] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'overview' | 'users'>('overview');

  // Return/Refund Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState<boolean>(false);
  const [returnTargetPlayer, setReturnTargetPlayer] = useState<any>(null);

  // Dynamic selected widgets: Initially empty per user request
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
  const [widgetSelections, setWidgetSelections] = useState<{
    playerId: string;
    tournamentId: string;
    teamId: string;
    sponsorId: string;
  }>(() => {
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
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string>('');
  const autosaveTimeoutRef = React.useRef<any>(null);

  // Autosave function that persists to both localStorage and MongoDB backend API
  const performAutosave = async (
    newWidgets: WidgetKey[],
    newSelections: {
      playerId: string;
      tournamentId: string;
      teamId: string;
      sponsorId: string;
    }
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
  const updateSelection = (key: 'playerId' | 'tournamentId' | 'teamId' | 'sponsorId', value: string) => {
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
  const loading = isStatsLoading;

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

  const fNum = (val: number | undefined) => {
    return (val || 0).toLocaleString('en-US');
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
          <div className="superadmin-dash-switch-bar">
            <div className="superadmin-dash-switch-pills">
              <button
                type="button"
                id="tab-command-overview"
                className={`superadmin-tab-btn ${adminTab === 'overview' ? 'active' : ''}`}
                onClick={() => setAdminTab('overview')}
              >
                <LayoutDashboardIcon size={16} />
                <span>Command Center & Match Hub</span>
              </button>
              <button
                type="button"
                id="tab-user-role-management"
                className={`superadmin-tab-btn ${adminTab === 'users' ? 'active' : ''}`}
                onClick={() => setAdminTab('users')}
              >
                <ShieldIcon size={16} />
                <span>Users & Role Management</span>
                <span className="superadmin-tab-tag">Super Admin</span>
              </button>
            </div>

            {adminTab === 'overview' ? (
              <button
                type="button"
                id="btn-switch-to-user-management"
                className="superadmin-quick-jump-btn"
                onClick={() => setAdminTab('users')}
              >
                <UsersIcon size={14} />
                <span>Manage Users & Roles &rarr;</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-switch-to-overview"
                className="superadmin-quick-jump-btn"
                onClick={() => setAdminTab('overview')}
              >
                <LayoutDashboardIcon size={14} />
                <span>&larr; Return to Match Hub</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: User & Role Management View (Super Admin Only) */}
        {adminTab === 'users' && isSuperAdmin ? (
          <UserRoleManagement />
        ) : (
          <>
            {/* =========================================================================
                TOP 4 BOXES: SMALL, LOW-PROFILE FINANCIAL METRICS (POSITIONED AT TOP)
               ========================================================================= */}
            <div className="mini-stats-grid">
          {/* Box 1: Total Invested */}
          <div className="mini-stat-card">
            <div
              className="mini-stat-icon-wrap"
              style={{ background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-blue)' }}
            >
              <DollarIcon size={18} />
            </div>
            <div className="mini-stat-info">
              <span className="mini-stat-label">Total Invested</span>
              <span className="mini-stat-val">Rs. {fNum(stats?.finances?.totalInvested)}</span>
              <span className="mini-stat-sub">Entry Fees + Expenses</span>
            </div>
          </div>

          {/* Box 2: Total Returns */}
          <div className="mini-stat-card">
            <div
              className="mini-stat-icon-wrap"
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-green)' }}
            >
              <TrendingUpIcon size={18} />
            </div>
            <div className="mini-stat-info">
              <span className="mini-stat-label">Total Returns</span>
              <span className="mini-stat-val" style={{ color: 'var(--accent-green)' }}>
                Rs. {fNum(stats?.finances?.totalReturns)}
              </span>
              <span className="mini-stat-sub">Sponsors + Winning Prizes</span>
            </div>
          </div>

          {/* Box 3: Net ROI / Profit */}
          <div className="mini-stat-card">
            <div
              className="mini-stat-icon-wrap"
              style={{
                background:
                  (stats?.finances?.netProfitLoss || 0) >= 0
                    ? 'rgba(245, 158, 11, 0.1)'
                    : 'rgba(244, 63, 94, 0.1)',
                color:
                  (stats?.finances?.netProfitLoss || 0) >= 0
                    ? 'var(--accent-amber)'
                    : 'var(--accent-rose)',
              }}
            >
              <TrophyIcon size={18} />
            </div>
            <div className="mini-stat-info">
              <span className="mini-stat-label">Net Profit / Loss</span>
              <span
                className="mini-stat-val"
                style={{
                  color:
                    (stats?.finances?.netProfitLoss || 0) >= 0
                      ? 'var(--accent-amber)'
                      : 'var(--accent-rose)',
                }}
              >
                Rs. {fNum(stats?.finances?.netProfitLoss)}
              </span>
              <span className="mini-stat-sub">
                {(stats?.finances?.netProfitLoss || 0) >= 0
                  ? '+ Profitable Season'
                  : '- Net Deficit'}
              </span>
            </div>
          </div>

          {/* Box 4: Player Fee Collection */}
          <div className="mini-stat-card">
            <div
              className="mini-stat-icon-wrap"
              style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--accent-purple)' }}
            >
              <UsersIcon size={18} />
            </div>
            <div className="mini-stat-info">
              <span className="mini-stat-label">Player Fee Collection</span>
              <span className="mini-stat-val" style={{ color: 'var(--accent-purple)' }}>
                {stats?.finances?.collectionRate || 0}%
              </span>
              <span className="mini-stat-sub">
                Rs. {fNum(stats?.finances?.totalPendingDues)} Pending Dues
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DYNAMIC WIDGET SELECTOR TOOLBAR
           ========================================================================= */}
        <div className="widget-toolbar">
          <div className="widget-toolbar-left">
            <div className="widget-toolbar-title">
              <LayoutDashboardIcon size={16} color="var(--accent-blue)" />
              <span>Personalized Widgets:</span>
              <Badge variant="purple" style={{ fontSize: '11px', padding: '1px 6px' }}>
                {selectedWidgets.length} / 4 Active
              </Badge>
            </div>

            {/* Autosave Status Badge */}
            <div
              className="autosave-indicator"
              title="All widget choices and entity selections are autosaved in real-time"
            >
              {autosaveStatus === 'saving' && (
                <span className="autosave-badge autosave-saving">
                  <ClockIcon size={11} className="spin-icon" />
                  <span>Autosaving...</span>
                </span>
              )}
              {autosaveStatus === 'saved' && (
                <span className="autosave-badge autosave-saved">
                  <CheckCircleIcon size={11} color="#15803d" />
                  <span>Autosaved {lastSavedTime ? `(${lastSavedTime})` : ''}</span>
                </span>
              )}
              {autosaveStatus === 'idle' && (
                <span className="autosave-badge autosave-idle">
                  <CheckCircleIcon size={11} color="#10b981" />
                  <span>Autosave on</span>
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="widget-pill-group">
              {/* Player Widget Toggle */}
              <button
                type="button"
                className={`widget-pill-btn ${selectedWidgets.includes('players') ? 'active' : ''}`}
                onClick={() => toggleWidget('players')}
                title="Toggle Player Widget"
              >
                <UsersIcon size={13} />
                <span>Player Widget</span>
                {selectedWidgets.includes('players') ? (
                  <CheckCircleIcon size={12} />
                ) : (
                  <PlusIcon size={12} />
                )}
              </button>

              {/* Tournament Widget Toggle */}
              <button
                type="button"
                className={`widget-pill-btn ${selectedWidgets.includes('tournaments') ? 'active' : ''}`}
                onClick={() => toggleWidget('tournaments')}
                title="Toggle Tournament Widget"
              >
                <TrophyIcon size={13} />
                <span>Tournament Widget</span>
                {selectedWidgets.includes('tournaments') ? (
                  <CheckCircleIcon size={12} />
                ) : (
                  <PlusIcon size={12} />
                )}
              </button>

              {/* Team Widget Toggle */}
              <button
                type="button"
                className={`widget-pill-btn ${selectedWidgets.includes('teams') ? 'active' : ''}`}
                onClick={() => toggleWidget('teams')}
                title="Toggle Team Widget"
              >
                <ShieldIcon size={13} />
                <span>Team Widget</span>
                {selectedWidgets.includes('teams') ? (
                  <CheckCircleIcon size={12} />
                ) : (
                  <PlusIcon size={12} />
                )}
              </button>

              {/* Sponsor Widget Toggle */}
              <button
                type="button"
                className={`widget-pill-btn ${selectedWidgets.includes('sponsors') ? 'active' : ''}`}
                onClick={() => toggleWidget('sponsors')}
                title="Toggle Sponsor Widget"
              >
                <HandshakeIcon size={13} />
                <span>Sponsor Widget</span>
                {selectedWidgets.includes('sponsors') ? (
                  <CheckCircleIcon size={12} />
                ) : (
                  <PlusIcon size={12} />
                )}
              </button>
            </div>

            {selectedWidgets.length < 4 && (
              <Button
                variant="primary"
                size="sm"
                onClick={addAllWidgets}
                style={{ fontSize: '11px', padding: '4px 10px', height: '28px' }}
              >
                + Add All
              </Button>
            )}

            {selectedWidgets.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={clearAllWidgets}
                style={{ fontSize: '11px', padding: '4px 8px', height: '28px', color: '#be123c' }}
                title="Reset dashboard to empty"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* =========================================================================
            STATE 1: INITIALLY EMPTY DASHBOARD STATE
           ========================================================================= */}
        {selectedWidgets.length === 0 && (
          <div className="dashboard-empty-canvas">
            <div className="dashboard-empty-icon">
              <LayoutDashboardIcon size={28} />
            </div>
            <h2 className="dashboard-empty-title">Build Your Custom Dashboard</h2>
            <p className="dashboard-empty-desc">
              Your dashboard is currently empty. Choose the widgets you want to monitor, and select
              either the entire group or a specific <strong>individual player</strong>,{' '}
              <strong>tournament</strong>, or <strong>team</strong>.
            </p>

            <div className="widget-selector-grid">
              {/* 1. Player Widget */}
              <div className="widget-selector-card">
                <div className="widget-selector-header">
                  <div
                    className="widget-selector-icon"
                    style={{ background: '#e0f2fe', color: '#0284c7' }}
                  >
                    <UsersIcon size={18} />
                  </div>
                  <div className="widget-selector-name">Player Widget</div>
                </div>
                <div className="widget-selector-text">
                  Track squad dues or select an individual player to inspect their personal match
                  scorecard and ledger.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={13} />}
                  onClick={() => toggleWidget('players')}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Add Player Widget
                </Button>
              </div>

              {/* 2. Tournament Widget */}
              <div className="widget-selector-card">
                <div className="widget-selector-header">
                  <div
                    className="widget-selector-icon"
                    style={{ background: '#fef3c7', color: '#d97706' }}
                  >
                    <TrophyIcon size={18} />
                  </div>
                  <div className="widget-selector-name">Tournament Widget</div>
                </div>
                <div className="widget-selector-text">
                  Monitor all active leagues or select an individual tournament to inspect its entry
                  cost, prize returns, and ROI.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={13} />}
                  onClick={() => toggleWidget('tournaments')}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Add Tournament Widget
                </Button>
              </div>

              {/* 3. Team Widget */}
              <div className="widget-selector-card">
                <div className="widget-selector-header">
                  <div
                    className="widget-selector-icon"
                    style={{ background: '#dcfce7', color: '#16a34a' }}
                  >
                    <ShieldIcon size={18} />
                  </div>
                  <div className="widget-selector-name">Team Widget</div>
                </div>
                <div className="widget-selector-text">
                  View club teams overview or select an individual squad (Tape Ball / Hard Ball) to
                  track its roster and match record.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={13} />}
                  onClick={() => toggleWidget('teams')}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Add Team Widget
                </Button>
              </div>

              {/* 4. Sponsor Widget */}
              <div className="widget-selector-card">
                <div className="widget-selector-header">
                  <div
                    className="widget-selector-icon"
                    style={{ background: '#f3e8ff', color: '#9333ea' }}
                  >
                    <HandshakeIcon size={18} />
                  </div>
                  <div className="widget-selector-name">Sponsor Widget</div>
                </div>
                <div className="widget-selector-text">
                  Follow all brand partners or select a specific brand sponsor to view their
                  deliverables, inflow, and return payouts.
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={13} />}
                  onClick={() => toggleWidget('sponsors')}
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  Add Sponsor Widget
                </Button>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <Button variant="secondary" size="sm" onClick={addAllWidgets}>
                <PlusIcon size={14} color="var(--accent-purple)" />
                <span style={{ fontWeight: 700 }}>Quick Start: Add All 4 Widgets</span>
              </Button>
            </div>
          </div>
        )}

        {/* =========================================================================
            STATE 2: DYNAMIC ACTIVE WIDGETS DISPLAY (GRID)
           ========================================================================= */}
        {selectedWidgets.length > 0 && (
          <div className="grid-2">
            {/* -------------------------------------------------------------------
                WIDGET 1: PLAYER WIDGET (WITH INDIVIDUAL SELECTION DROPDOWN)
               ------------------------------------------------------------------- */}
            {selectedWidgets.includes('players') && (
              <div className="dashboard-widget-card">
                <div className="widget-card-header">
                  <div className="widget-card-title-group" style={{ flexGrow: 1, minWidth: 0 }}>
                    <div
                      className="widget-card-icon"
                      style={{ background: '#e0f2fe', color: '#0369a1' }}
                    >
                      <UsersIcon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="widget-card-title" style={{ whiteSpace: 'nowrap' }}>
                        Player Squad & Dues
                      </h3>
                    </div>

                    {/* Individual Player Selection Dropdown */}
                    <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                      <select
                        className="ledger-select"
                        value={widgetSelections.playerId}
                        onChange={(e) => updateSelection('playerId', e.target.value)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 22px 3px 8px',
                          height: '26px',
                          maxWidth: '160px',
                          backgroundPosition: 'right 6px center',
                          backgroundSize: '10px 10px',
                          fontWeight: 600,
                        }}
                        title="Select an individual player or view all"
                      >
                        <option value="all">All Players (Overview)</option>
                        {playersList.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.jerseyNumber !== undefined &&
                            p.jerseyNumber !== null &&
                            p.jerseyNumber !== ''
                              ? `#${p.jerseyNumber} `
                              : ''}
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="widget-card-actions">
                    <button
                      type="button"
                      className="widget-remove-btn"
                      onClick={() => toggleWidget('players')}
                      title="Remove Player Widget"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                </div>

                <div className="widget-card-body">
                  {/* OPTION A: INDIVIDUAL PLAYER SPOTLIGHT */}
                  {selectedIndividualPlayer ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      {/* Individual Player Card */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: '#e0f2fe',
                              border: '1px solid #bae6fd',
                              color: '#0369a1',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '14px',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {selectedIndividualPlayer.jerseyNumber !== undefined &&
                            selectedIndividualPlayer.jerseyNumber !== null &&
                            selectedIndividualPlayer.jerseyNumber !== ''
                              ? `#${selectedIndividualPlayer.jerseyNumber}`
                              : selectedIndividualPlayer.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span
                                style={{
                                  fontSize: '15px',
                                  fontWeight: 800,
                                  color: 'var(--text-primary)',
                                }}
                              >
                                {selectedIndividualPlayer.name}
                              </span>
                              <Badge
                                variant="purple"
                                style={{
                                  fontSize: '9.5px',
                                  textTransform: 'capitalize',
                                  padding: '1px 5px',
                                }}
                              >
                                {selectedIndividualPlayer.role?.replace(/_/g, ' ') || 'Player'}
                              </Badge>
                            </div>
                            <div
                              style={{
                                fontSize: '11px',
                                color: 'var(--text-muted)',
                                marginTop: '2px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {selectedIndividualPlayer.phone ? `Phone: ${selectedIndividualPlayer.phone}` : 'No phone recorded'}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {(selectedIndividualPlayer.pendingDue || 0) > 0 ? (
                            <Badge
                              variant="danger"
                              style={{ fontSize: '11px', padding: '3px 8px', fontWeight: 800 }}
                            >
                              Rs. {fNum(selectedIndividualPlayer.pendingDue)} Due
                            </Badge>
                          ) : (
                            <Badge
                              variant="success"
                              icon={<CheckCircleIcon size={11} />}
                              style={{ fontSize: '11px', padding: '3px 8px' }}
                            >
                              Fully Cleared
                            </Badge>
                          )}

                          {(selectedIndividualPlayer.totalReturned || 0) > 0 && (
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#b45309',
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                padding: '1px 6px',
                                borderRadius: '4px',
                              }}
                              title="Total funds returned/refunded to this player from winnings/sponsors"
                            >
                              Rs. {fNum(selectedIndividualPlayer.totalReturned)} Returned
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 6 KPI Cells for Individual Player: Matches, Tournaments, Assigned, Paid, Returned, Due */}
                      <div
                        className="widget-kpi-row r-grid-3"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Matches Played</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            {selectedIndividualPlayer.matchesPlayed || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Tournaments</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-purple)' }}>
                            {selectedIndividualPlayer.tournamentsCount || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Fee Assigned</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--text-primary)' }}>
                            Rs. {fNum(selectedIndividualPlayer.totalFeeAssigned)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Fee Paid</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs. {fNum(selectedIndividualPlayer.totalFeePaid)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Returned / Refund</div>
                          <div
                            className="widget-kpi-val"
                            style={{
                              color:
                                (selectedIndividualPlayer.totalReturned || 0) > 0
                                  ? 'var(--accent-amber)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            Rs. {fNum(selectedIndividualPlayer.totalReturned || 0)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Outstanding Due</div>
                          <div
                            className="widget-kpi-val"
                            style={{
                              color:
                                (selectedIndividualPlayer.pendingDue || 0) > 0
                                    ? 'var(--accent-rose)'
                                    : 'var(--accent-green)',
                            }}
                          >
                            Rs. {fNum(selectedIndividualPlayer.pendingDue || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Secondary Info, Quick Return Action & Switch Back */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          padding: '8px 12px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          marginTop: 'auto',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>
                            Batting: <strong>{selectedIndividualPlayer.battingStyle?.replace(/_/g, ' ') || 'Right Hand'}</strong>
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setReturnTargetPlayer(selectedIndividualPlayer);
                              setIsReturnModalOpen(true);
                            }}
                            style={{
                              background: '#fef3c7',
                              border: '1px solid #fde68a',
                              color: '#b45309',
                              borderRadius: '6px',
                              padding: '4px 10px',
                              fontWeight: 700,
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title="Return excess fee, winning prize share, or sponsor payout"
                          >
                            <span>Return Money</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => updateSelection('playerId', 'all')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--accent-blue)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '11px',
                            }}
                          >
                            ← Switch to All
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* OPTION B: ALL PLAYERS OVERVIEW */
                    <>
                      {/* KPI Row */}
                      <div
                        className="widget-kpi-row r-grid-4"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(4, 1fr)',
                          gap: '6px',
                          marginBottom: '10px',
                        }}
                      >
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Squad</div>
                          <div className="widget-kpi-val">
                            {playersList.length || stats?.summary?.totalPlayers || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Assigned</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--text-primary)' }}>
                            Rs. {fNum(stats?.finances?.totalFeeAssigned)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Collected</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs. {fNum(stats?.finances?.totalFeeCollected)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Uncollected</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-rose)' }}>
                            Rs. {fNum(stats?.finances?.totalPendingDues)}
                          </div>
                        </div>
                      </div>

                      {/* High Density Player Dues List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stats?.topDebtors?.length === 0 ? (
                          <div
                            style={{
                              padding: '24px',
                              textAlign: 'center',
                              color: 'var(--accent-green)',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            All players are 100% cleared! No outstanding match fees.
                          </div>
                        ) : (
                          stats?.topDebtors?.slice(0, 4).map((pl: any) => (
                            <div
                              key={pl.id}
                              onClick={() => {
                                updateSelection('playerId', pl.id);
                              }}
                              style={{
                                padding: '10px 12px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                              }}
                              title={`Click to spotlight ${pl.name}`}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: '#e0f2fe',
                                    color: '#0369a1',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                  }}
                                >
                                  {pl.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {pl.name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {pl.phone || 'No phone'}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <Badge
                                  variant="danger"
                                  style={{ fontSize: '10.5px', padding: '2px 7px', fontWeight: 800 }}
                                >
                                  Rs. {fNum(pl.pending)} Due
                                </Badge>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                  }}
                                >
                                  Paid: Rs. {fNum(pl.paid)} / {fNum(pl.assigned)}
                                  {(pl.returned || 0) > 0 && (
                                    <span style={{ color: '#b45309', marginLeft: '4px' }}>
                                      • Ret: Rs. {fNum(pl.returned)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="widget-card-footer">
                  {selectedIndividualPlayer ? (
                    <>
                      <span>Open full ledger for {selectedIndividualPlayer.name}</span>
                      <Link href={`/players/${selectedIndividualPlayer._id}`}>
                        <span>Player Profile</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span>Manage all player profiles & ledgers</span>
                      <Link href="/players">
                        <span>Open Rosters</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------
                WIDGET 2: TOURNAMENT WIDGET (WITH INDIVIDUAL SELECTION DROPDOWN)
               ------------------------------------------------------------------- */}
            {selectedWidgets.includes('tournaments') && (
              <div className="dashboard-widget-card">
                <div className="widget-card-header">
                  <div className="widget-card-title-group" style={{ flexGrow: 1, minWidth: 0 }}>
                    <div
                      className="widget-card-icon"
                      style={{ background: '#fef3c7', color: '#b45309' }}
                    >
                      <TrophyIcon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="widget-card-title" style={{ whiteSpace: 'nowrap' }}>
                        Tournaments & Leagues
                      </h3>
                    </div>

                    {/* Individual Tournament Selection Dropdown */}
                    <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                      <select
                        className="ledger-select"
                        value={widgetSelections.tournamentId}
                        onChange={(e) => updateSelection('tournamentId', e.target.value)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 22px 3px 8px',
                          height: '26px',
                          maxWidth: '160px',
                          backgroundPosition: 'right 6px center',
                          backgroundSize: '10px 10px',
                          fontWeight: 600,
                        }}
                        title="Select an individual tournament or view all"
                      >
                        <option value="all">All Tournaments</option>
                        {tournamentsList.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="widget-card-actions">
                    <button
                      type="button"
                      className="widget-remove-btn"
                      onClick={() => toggleWidget('tournaments')}
                      title="Remove Tournament Widget"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                </div>

                <div className="widget-card-body">
                  {/* OPTION A: INDIVIDUAL TOURNAMENT SPOTLIGHT */}
                  {selectedIndividualTournament ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      {/* Individual Tournament Header Card */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <Badge variant="purple" style={{ fontSize: '9.5px', padding: '1px 5px' }}>
                              {selectedIndividualTournament.format || 'Tape Ball'}
                            </Badge>
                            <Badge
                              variant={
                                selectedIndividualTournament.status === 'champions'
                                  ? 'gold'
                                  : selectedIndividualTournament.status === 'ongoing'
                                  ? 'primary'
                                  : 'success'
                              }
                              style={{ fontSize: '9.5px', textTransform: 'uppercase' }}
                            >
                              {selectedIndividualTournament.status || 'ongoing'}
                            </Badge>
                          </div>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color: 'var(--text-primary)',
                            }}
                          >
                            {selectedIndividualTournament.name}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              marginTop: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <MapPinIcon size={11} />
                            <span>{selectedIndividualTournament.venue || 'Karachi Grounds'}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Net ROI
                          </div>
                          <div
                            style={{
                              fontSize: '15px',
                              fontWeight: 800,
                              color:
                                (selectedIndividualTournament.financials?.netPnl ?? 0) >= 0
                                  ? 'var(--accent-green)'
                                  : 'var(--accent-rose)',
                            }}
                          >
                            {(selectedIndividualTournament.financials?.netPnl ?? 0) >= 0 ? '+' : ''}
                            Rs. {fNum(selectedIndividualTournament.financials?.netPnl ?? 0)}
                          </div>
                        </div>
                      </div>

                      {/* 4 Financial KPI Cells */}
                      <div className="r-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Entry Fee</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-rose)' }}>
                            Rs. {fNum(selectedIndividualTournament.entryFee || 0)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Match Costs</div>
                          <div className="widget-kpi-val">
                            Rs. {fNum(selectedIndividualTournament.financials?.totalMatchExpenses || 0)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Prize Won</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs.{' '}
                            {fNum(
                              selectedIndividualTournament.financials?.actualWinningPrizeWon ||
                                selectedIndividualTournament.actualWinningPrizeWon ||
                                0
                            )}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Matches</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            {selectedIndividualTournament.matchesPlayed || 0}
                          </div>
                        </div>
                      </div>

                      {/* Secondary Info & Switch Back */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          marginTop: 'auto',
                        }}
                      >
                        <span>
                          Team: <strong>{selectedIndividualTournament.teamId?.name || 'Gulzar Cricket Team'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSelection('tournamentId', 'all')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-blue)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Switch to All Tournaments
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* OPTION B: ALL TOURNAMENTS OVERVIEW */
                    <>
                      {/* KPI Row */}
                      <div className="widget-kpi-row">
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Active Leagues</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-amber)' }}>
                            {stats?.summary?.activeTournaments || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Prize Returns</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs. {fNum(stats?.finances?.totalPrizeMoney)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Total Leagues</div>
                          <div className="widget-kpi-val">
                            {stats?.summary?.totalTournaments || tournamentsList.length}
                          </div>
                        </div>
                      </div>

                      {/* High Density Tournaments List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {tournamentsList.length === 0 ? (
                          <div
                            style={{
                              padding: '24px',
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '13px',
                            }}
                          >
                            No tournaments registered yet.
                          </div>
                        ) : (
                          tournamentsList.slice(0, 4).map((trn) => {
                            const netPnl = trn.financials?.netPnl ?? 0;
                            const isProfitable = netPnl >= 0;

                            return (
                              <div
                                key={trn._id}
                                onClick={() => updateSelection('tournamentId', trn._id)}
                                style={{
                                  padding: '10px 12px',
                                  background: '#f8fafc',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                }}
                                title={`Click to spotlight ${trn.name}`}
                              >
                                <div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      marginBottom: '3px',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: '13px',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                      }}
                                    >
                                      {trn.name}
                                    </span>
                                    <Badge
                                      variant="purple"
                                      style={{ fontSize: '9px', padding: '1px 5px' }}
                                    >
                                      {trn.format || 'Tape Ball'}
                                    </Badge>
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--text-muted)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    <MapPinIcon size={11} />
                                    <span>{trn.venue || 'Karachi Grounds'}</span>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                  <Badge
                                    variant={
                                      trn.status === 'champions'
                                        ? 'gold'
                                        : trn.status === 'ongoing'
                                        ? 'primary'
                                        : 'success'
                                    }
                                    style={{ fontSize: '9.5px', textTransform: 'uppercase' }}
                                  >
                                    {trn.status || 'ongoing'}
                                  </Badge>
                                  <div
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: isProfitable
                                        ? 'var(--accent-green)'
                                        : 'var(--accent-rose)',
                                      marginTop: '2px',
                                    }}
                                  >
                                    {isProfitable ? '+' : ''}Rs. {fNum(netPnl)} ROI
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="widget-card-footer">
                  {selectedIndividualTournament ? (
                    <>
                      <span>Open full tournament breakdown for {selectedIndividualTournament.name}</span>
                      <Link href={`/tournaments/${selectedIndividualTournament._id}`}>
                        <span>Tournament Profile</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span>Browse all tournaments & entry fees</span>
                      <Link href="/tournaments">
                        <span>Open Tournaments</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------
                WIDGET 3: TEAM WIDGET (WITH INDIVIDUAL SELECTION DROPDOWN)
               ------------------------------------------------------------------- */}
            {selectedWidgets.includes('teams') && (
              <div className="dashboard-widget-card">
                <div className="widget-card-header">
                  <div className="widget-card-title-group" style={{ flexGrow: 1, minWidth: 0 }}>
                    <div
                      className="widget-card-icon"
                      style={{ background: '#dcfce7', color: '#15803d' }}
                    >
                      <ShieldIcon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="widget-card-title" style={{ whiteSpace: 'nowrap' }}>
                        Club Teams & Squads
                      </h3>
                    </div>

                    {/* Individual Team Selection Dropdown */}
                    <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                      <select
                        className="ledger-select"
                        value={widgetSelections.teamId}
                        onChange={(e) => updateSelection('teamId', e.target.value)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 22px 3px 8px',
                          height: '26px',
                          maxWidth: '160px',
                          backgroundPosition: 'right 6px center',
                          backgroundSize: '10px 10px',
                          fontWeight: 600,
                        }}
                        title="Select an individual team or view all"
                      >
                        <option value="all">All Teams</option>
                        {teamsList.map((tm) => (
                          <option key={tm._id} value={tm._id}>
                            {tm.shortName} - {tm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="widget-card-actions">
                    <button
                      type="button"
                      className="widget-remove-btn"
                      onClick={() => toggleWidget('teams')}
                      title="Remove Team Widget"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                </div>

                <div className="widget-card-body">
                  {/* OPTION A: INDIVIDUAL TEAM SPOTLIGHT */}
                  {selectedIndividualTeam ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      {/* Individual Team Header Card */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          borderLeft: `5px solid ${selectedIndividualTeam.primaryColor || '#0284c7'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {selectedIndividualTeam.name}
                            </span>
                            <Badge
                              variant="purple"
                              style={{
                                background: selectedIndividualTeam.primaryColor
                                  ? `${selectedIndividualTeam.primaryColor}18`
                                  : undefined,
                                color: selectedIndividualTeam.primaryColor || '#0284c7',
                                fontSize: '10px',
                                fontWeight: 800,
                              }}
                            >
                              {selectedIndividualTeam.shortName}
                            </Badge>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Base City: {selectedIndividualTeam.city || 'Karachi'}
                            {selectedIndividualTeam.description && ` • ${selectedIndividualTeam.description}`}
                          </div>
                        </div>
                      </div>

                      {/* 3 KPI Cells */}
                      <div className="widget-kpi-row">
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Active Squad</div>
                          <div className="widget-kpi-val">
                            {selectedIndividualTeam.playerCount || 0} Players
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Matches Played</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            {selectedIndividualTeam.matchCount || 0} Matches
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Leagues Enrolled</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            {selectedIndividualTeam.tournamentCount || 0} Leagues
                          </div>
                        </div>
                      </div>

                      {/* Secondary Info & Switch Back */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          marginTop: 'auto',
                        }}
                      >
                        <span>
                          Jersey Color:{' '}
                          <strong style={{ color: selectedIndividualTeam.primaryColor || '#0284c7' }}>
                            {selectedIndividualTeam.primaryColor || '#0284c7'}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSelection('teamId', 'all')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-blue)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Switch to All Teams
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* OPTION B: ALL TEAMS OVERVIEW */
                    <>
                      {/* KPI Row */}
                      <div className="widget-kpi-row">
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Active Teams</div>
                          <div className="widget-kpi-val">
                            {teamsList.length || stats?.summary?.totalTeams || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Total Matches</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            {stats?.summary?.totalMatches || 0}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Win Rate</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            {stats?.summary?.winRate || 0}%
                          </div>
                        </div>
                      </div>

                      {/* High Density Team Cards List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {teamsList.length === 0 ? (
                          <div
                            style={{
                              padding: '24px',
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '13px',
                            }}
                          >
                            No teams found. Click Manage to add club teams.
                          </div>
                        ) : (
                          teamsList.map((tm) => (
                            <div
                              key={tm._id}
                              onClick={() => updateSelection('teamId', tm._id)}
                              style={{
                                padding: '10px 12px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                borderLeft: `4px solid ${tm.primaryColor || '#0284c7'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                              }}
                              title={`Click to spotlight ${tm.name}`}
                            >
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '2px',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '13.5px',
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {tm.name}
                                  </span>
                                  <Badge
                                    variant="purple"
                                    style={{
                                      background: tm.primaryColor ? `${tm.primaryColor}18` : undefined,
                                      color: tm.primaryColor || '#0284c7',
                                      fontSize: '9.5px',
                                      fontWeight: 800,
                                    }}
                                  >
                                    {tm.shortName}
                                  </Badge>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Base: {tm.city || 'Karachi'}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: 'var(--text-muted)',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Players
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {tm.playerCount || 0}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: 'var(--text-muted)',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Matches
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      color: 'var(--accent-blue)',
                                    }}
                                  >
                                    {tm.matchCount || 0}
                                  </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                  <div
                                    style={{
                                      fontSize: '10px',
                                      color: 'var(--text-muted)',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Leagues
                                  </div>
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 800,
                                      color: 'var(--accent-green)',
                                    }}
                                  >
                                    {tm.tournamentCount || 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="widget-card-footer">
                  {selectedIndividualTeam ? (
                    <>
                      <span>Open squad list for {selectedIndividualTeam.name}</span>
                      <Link href={`/teams/${selectedIndividualTeam._id}`}>
                        <span>Team Details</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span>Manage club teams, tape ball & hard ball squads</span>
                      <Link href="/teams">
                        <span>Open Teams</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* -------------------------------------------------------------------
                WIDGET 4: SPONSOR WIDGET (WITH INDIVIDUAL SELECTION DROPDOWN)
               ------------------------------------------------------------------- */}
            {selectedWidgets.includes('sponsors') && (
              <div className="dashboard-widget-card">
                <div className="widget-card-header">
                  <div className="widget-card-title-group" style={{ flexGrow: 1, minWidth: 0 }}>
                    <div
                      className="widget-card-icon"
                      style={{ background: '#f3e8ff', color: '#7e22ce' }}
                    >
                      <HandshakeIcon size={16} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h3 className="widget-card-title" style={{ whiteSpace: 'nowrap' }}>
                        Brand Sponsors & Grants
                      </h3>
                    </div>

                    {/* Individual Sponsor Selection Dropdown */}
                    <div style={{ marginLeft: 'auto', marginRight: '8px' }}>
                      <select
                        className="ledger-select"
                        value={widgetSelections.sponsorId}
                        onChange={(e) => updateSelection('sponsorId', e.target.value)}
                        style={{
                          fontSize: '11px',
                          padding: '3px 22px 3px 8px',
                          height: '26px',
                          maxWidth: '160px',
                          backgroundPosition: 'right 6px center',
                          backgroundSize: '10px 10px',
                          fontWeight: 600,
                        }}
                        title="Select an individual sponsor or view all"
                      >
                        <option value="all">All Sponsors</option>
                        {sponsorsList.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.companyName || s.sponsorName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="widget-card-actions">
                    <button
                      type="button"
                      className="widget-remove-btn"
                      onClick={() => toggleWidget('sponsors')}
                      title="Remove Sponsor Widget"
                    >
                      <CloseIcon size={14} />
                    </button>
                  </div>
                </div>

                <div className="widget-card-body">
                  {/* OPTION A: INDIVIDUAL SPONSOR SPOTLIGHT */}
                  {selectedIndividualSponsor ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
                      {/* Individual Sponsor Header Card */}
                      <div
                        style={{
                          padding: '12px 14px',
                          background: '#f8fafc',
                          borderRadius: '10px',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {selectedIndividualSponsor.companyName || selectedIndividualSponsor.sponsorName}
                            </span>
                            <Badge variant="purple" style={{ fontSize: '9.5px', textTransform: 'capitalize' }}>
                              {selectedIndividualSponsor.contractType?.replace(/_/g, ' ') || 'General Grant'}
                            </Badge>
                            <Badge variant="success" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                              {selectedIndividualSponsor.status || 'ACTIVE'}
                            </Badge>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            Contact Partner: {selectedIndividualSponsor.sponsorName}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                            Net Retained
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                            Rs. {fNum((selectedIndividualSponsor.amountInvested || 0) - (selectedIndividualSponsor.returnsPaid || 0))}
                          </div>
                        </div>
                      </div>

                      {/* 3 KPI Cells */}
                      <div className="widget-kpi-row">
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Inflow Invested</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            Rs. {fNum(selectedIndividualSponsor.amountInvested)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Returns Paid</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-rose)' }}>
                            Rs. {fNum(selectedIndividualSponsor.returnsPaid)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Net Club Fund</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs. {fNum((selectedIndividualSponsor.amountInvested || 0) - (selectedIndividualSponsor.returnsPaid || 0))}
                          </div>
                        </div>
                      </div>

                      {/* Secondary Info & Switch Back */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: '#f1f5f9',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          color: 'var(--text-secondary)',
                          marginTop: 'auto',
                        }}
                      >
                        <span>
                          Contract: <strong>{selectedIndividualSponsor.deliverables || 'Kit & Banner Rights'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => updateSelection('sponsorId', 'all')}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--accent-blue)',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: '11px',
                          }}
                        >
                          ← Switch to All Sponsors
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* OPTION B: ALL SPONSORS OVERVIEW */
                    <>
                      {/* KPI Row */}
                      <div className="widget-kpi-row">
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Inflow Invested</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-blue)' }}>
                            Rs. {fNum(stats?.finances?.totalSponsorInvested)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Net Retained</div>
                          <div className="widget-kpi-val" style={{ color: 'var(--accent-green)' }}>
                            Rs. {fNum(stats?.finances?.netSponsorship)}
                          </div>
                        </div>
                        <div className="widget-kpi-cell">
                          <div className="widget-kpi-label">Active Grants</div>
                          <div className="widget-kpi-val">
                            {sponsorsList.filter((s) => s.status === 'active').length || sponsorsList.length}
                          </div>
                        </div>
                      </div>

                      {/* High Density Sponsors List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {sponsorsList.length === 0 ? (
                          <div
                            style={{
                              padding: '24px',
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '13px',
                            }}
                          >
                            No sponsors registered yet.
                          </div>
                        ) : (
                          sponsorsList.slice(0, 4).map((spons) => (
                            <div
                              key={spons._id}
                              onClick={() => updateSelection('sponsorId', spons._id)}
                              style={{
                                padding: '10px 12px',
                                background: '#f8fafc',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                              }}
                              title={`Click to spotlight ${spons.companyName || spons.sponsorName}`}
                            >
                              <div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: '2px',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: 'var(--text-primary)',
                                    }}
                                  >
                                    {spons.companyName || spons.sponsorName}
                                  </span>
                                  <Badge
                                    variant="purple"
                                    style={{
                                      fontSize: '9px',
                                      padding: '1px 5px',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {spons.contractType?.replace(/_/g, ' ') || 'Grant'}
                                  </Badge>
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  Contact: {spons.sponsorName}
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: 'var(--accent-blue)',
                                  }}
                                >
                                  Rs. {fNum(spons.amountInvested)}
                                </div>
                                <div
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--text-muted)',
                                    marginTop: '2px',
                                  }}
                                >
                                  Payout: Rs. {fNum(spons.returnsPaid)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="widget-card-footer">
                  {selectedIndividualSponsor ? (
                    <>
                      <span>Open brand contract for {selectedIndividualSponsor.companyName || selectedIndividualSponsor.sponsorName}</span>
                      <Link href={`/sponsors/${selectedIndividualSponsor._id}`}>
                        <span>Sponsor Details</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  ) : (
                    <>
                      <span>View all brand sponsors, deliverables & payouts</span>
                      <Link href="/sponsors">
                        <span>Open Sponsors</span>
                        <ChevronRightIcon size={12} />
                      </Link>
                    </>
                  )}
                </div>
              </div>
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
