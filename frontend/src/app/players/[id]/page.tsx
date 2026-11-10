'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';
import { fetchApi } from '../../../lib/api';
import { formatDate, formatNumber, formatLabel } from '../../../lib/format';
import { confirmDelete, confirmDuesClear, showToast } from '../../../lib/alerts';
import { Button, Badge, Modal, DataTable, Avatar, ViewSwitcher } from '../../../components/ui';
import {
  PencilIcon,
  Search,
  Filter,
} from '../../../components/icons';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { PlayerReturnModal } from '../../../components/PlayerReturnModal';
import { EditPlayerModal } from '../../../components/EditPlayerModal';
import { EditPaymentModal } from '../../../components/EditPaymentModal';

import { useIsMobile } from '../../../lib/useMediaQuery';
import { getPlayerReturnColumns, getPlayerMatchFeeColumns } from '../../../columns/playerDetailColumns';
import { DetailNav } from '../../../components/DetailNav';
import { SegmentedTabs } from '../../../components/ui';

type LedgerStatusFilter = 'all' | 'pending' | 'cleared' | 'mom';

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  // Tournament-Wise Ledger States
  const [preferredView, setViewMode] = useState<'grid' | 'table'>('grid');
  // Phones always show the list; the List/Grid switch is hidden there (globals.css).
  const isMobile = useIsMobile();
  const viewMode = isMobile ? 'table' : preferredView;
  const [tourneyFilterTab, setTourneyFilterTab] = useState<'all' | 'due' | 'cleared'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedMatches, setExpandedMatches] = useState<Record<string, boolean>>({});

  const toggleMatchExpansion = (groupId: string) => {
    setExpandedMatches((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [isReturnOpen, setIsReturnOpen] = useState<boolean>(false);

  // React Queries
  const playerQuery = useQuery({
    queryKey: queryKeys.player(id),
    queryFn: () => fetchApi<{ success: boolean; player: any; ledger: any }>(`/players/${id}`),
    enabled: !!id,
  });

  const tourneysQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () => fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
  });

  const data = playerQuery.data;
  const loading = playerQuery.isLoading;

  const tournamentsMap = useMemo<Record<string, any>>(() => {
    const map: Record<string, any> = {};
    if (tourneysQuery.data?.tournaments) {
      tourneysQuery.data.tournaments.forEach((t: any) => {
        map[t._id] = t;
      });
    }
    return map;
  }, [tourneysQuery.data]);

  const invalidatePlayerData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.player(id) });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.playerReturns(id) });
  };

  const handleDeletePlayer = async () => {
    const confirmed = await confirmDelete(`player "${data?.player?.name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Player "${data?.player?.name}" deactivated.`);
        router.push('/players');
      }
    } catch (err) {
      showToast.error('Failed to deactivate player.');
    }
  };

  const handleQuickMarkPaid = async (paymentId: string, fullFee: number) => {
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: fullFee,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString(),
        }),
      });
      if (res.success) {
        showToast.success('Match fee marked as paid!');
        invalidatePlayerData();
      }
    } catch (err) {
      showToast.error('Failed to update match fee payment.');
    }
  };

  const handleClearAllPendingDues = async () => {
    const pendingList = matchHistory.filter((p: any) => p.paymentStatus !== 'paid');
    if (pendingList.length === 0) return;
    const confirmed = await confirmDuesClear(pendingList.length, formatNumber(pendingDue), player.name);
    if (!confirmed) return;
    try {
      const updates = pendingList.map((p: any) => ({
        id: p._id,
        feePaid: p.feeAssigned,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
      }));
      const res = await fetchApi<{ success: boolean }>('/payments/bulk', {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });
      if (res.success) {
        showToast.success(`All ${pendingList.length} pending dues cleared for ${player.name}!`);
        invalidatePlayerData();
      }
    } catch (err) {
      showToast.error('Failed to clear pending dues.');
    }
  };

  // Filtered & sorted ledger matches
  const matchHistory: any[] = data?.ledger?.matchHistory || [];
  const momAwards: any[] = data?.ledger?.momAwards || [];
  const totalAssigned = data?.ledger?.totalFeeAssigned || 0;
  const totalPaid = data?.ledger?.totalFeePaid || 0;
  const totalReturned = data?.ledger?.totalReturned || 0;
  const pendingDue = data?.ledger?.pendingDue || 0;
  const playerReturns: any[] = data?.ledger?.returns || [];
  const isCleared = pendingDue <= 0;
  const player = data?.player;

  const handleDeleteReturn = async (returnId: string, amount?: number) => {
    const label = amount ? `return record of Rs. ${formatNumber(amount)}` : 'return record';
    const confirmed = await confirmDelete(label, 'Are you sure you want to delete this payout/return record?');
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/player-returns/${returnId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast.success('Return record deleted.');
        invalidatePlayerData();
      }
    } catch (err) {
      showToast.error('Failed to delete return record.');
    }
  };

  const pendingMatchesCount = useMemo(
    () => matchHistory.filter((m) => m.paymentStatus !== 'paid').length,
    [matchHistory]
  );
  const clearedMatchesCount = useMemo(
    () => matchHistory.filter((m) => m.paymentStatus === 'paid').length,
    [matchHistory]
  );

  // Available tournament and team options dynamically extracted from player data
  const availableTournaments = useMemo(() => {
    const map = new Map<string, string>();
    matchHistory.forEach((rec) => {
      const tourney = rec.matchId?.tournamentId;
      if (tourney?._id && tourney?.name) {
        map.set(tourney._id, tourney.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matchHistory]);

  interface TournamentGroup {
    id: string;
    name: string;
    shortName?: string;
    year?: number | string;
    format?: string;
    isFriendly: boolean;
    matches: any[];
    returns: any[];
    totalAssigned: number;
    totalPaid: number;
    totalReturned: number;
    pendingDue: number;
    isCleared: boolean;
    tourneyFinancials?: {
      entryFee: number;
      tournamentExpenses: number;
      matchExpenses: number;
      totalInvested: number;
      sponsorFunds: number;
      actualWinningPrizeWon: number;
      matchPrizeWon: number;
      totalReturns: number;
      netPnl: number;
    };
  }

  // Handle clearing all dues for a single tournament group
  const handleClearGroupPendingDues = async (grp: TournamentGroup) => {
    const pendingList = grp.matches.filter((p: any) => p.paymentStatus !== 'paid');
    if (pendingList.length === 0) return;
    const confirmed = await confirmDuesClear(pendingList.length, formatNumber(grp.pendingDue), grp.name);
    if (!confirmed) return;
    try {
      const updates = pendingList.map((p: any) => ({
        id: p._id,
        feePaid: p.feeAssigned,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
      }));
      const res = await fetchApi<{ success: boolean }>('/payments/bulk', {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });
      if (res.success) {
        showToast.success(`Dues cleared for ${grp.name}!`);
        invalidatePlayerData();
      }
    } catch (err) {
      showToast.error('Failed to clear tournament dues.');
    }
  };

  // Group matchHistory by Tournament
  const tournamentGroups = useMemo<TournamentGroup[]>(() => {
    const groupsMap = new Map<string, TournamentGroup>();

    matchHistory.forEach((rec) => {
      const match = rec.matchId;
      const tourney = match?.tournamentId;
      const isFriendly = !tourney || match?.matchType === 'friendly';
      const groupId = isFriendly ? 'friendly_matches' : (tourney._id?.toString() || tourney.toString());
      const groupName = isFriendly ? 'Friendly & Bilateral Matches' : (tourney.name || 'Tournament Matches');

      if (!groupsMap.has(groupId)) {
        const tourneyInfo = !isFriendly && tourney?._id ? tournamentsMap[tourney._id] : undefined;
        groupsMap.set(groupId, {
          id: groupId,
          name: groupName,
          shortName: tourney?.shortName,
          year: tourney?.year,
          format: tourney?.format,
          isFriendly,
          matches: [],
          returns: [],
          totalAssigned: 0,
          totalPaid: 0,
          totalReturned: 0,
          pendingDue: 0,
          isCleared: true,
          tourneyFinancials: tourneyInfo?.financials,
        });
      }

      const grp = groupsMap.get(groupId)!;
      grp.matches.push(rec);
      grp.totalAssigned += Number(rec.feeAssigned) || 0;
      grp.totalPaid += Number(rec.feePaid) || 0;
    });

    // Also link tournament returns if available
    playerReturns.forEach((ret) => {
      const tId = ret.tournamentId?._id?.toString() || ret.tournamentId?.toString();
      if (tId && groupsMap.has(tId)) {
        const grp = groupsMap.get(tId)!;
        grp.returns.push(ret);
        grp.totalReturned += Number(ret.amount) || 0;
      }
    });

    // Finalize financials, pendingDue & isCleared and sort matches newest first
    groupsMap.forEach((grp) => {
      if (!grp.isFriendly && tournamentsMap[grp.id]?.financials) {
        grp.tourneyFinancials = tournamentsMap[grp.id].financials;
      }
      grp.pendingDue = Math.max(0, grp.totalAssigned - grp.totalPaid);
      grp.isCleared = grp.pendingDue <= 0;
      grp.matches.sort(
        (a, b) =>
          new Date(b.matchId?.matchDate || 0).getTime() -
          new Date(a.matchId?.matchDate || 0).getTime()
      );
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.isFriendly) return 1;
      if (b.isFriendly) return -1;
      if (b.pendingDue !== a.pendingDue) return b.pendingDue - a.pendingDue;
      return a.name.localeCompare(b.name);
    });
  }, [matchHistory, playerReturns, tournamentsMap]);

  const displayedGroups = useMemo(() => {
    return tournamentGroups.filter((grp) => {
      if (tourneyFilterTab === 'due' && grp.pendingDue <= 0) return false;
      if (tourneyFilterTab === 'cleared' && grp.pendingDue > 0) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = grp.name.toLowerCase().includes(term);
        const matchesMatch = grp.matches.some(
          (m) =>
            (m.matchId?.opponentTeam || '').toLowerCase().includes(term) ||
            (m.matchId?.tournamentStage || '').toLowerCase().includes(term) ||
            (m.notes || '').toLowerCase().includes(term)
        );
        if (!matchesName && !matchesMatch) return false;
      }
      return true;
    });
  }, [tournamentGroups, tourneyFilterTab, searchTerm]);

  const groupsWithDue = useMemo(
    () => tournamentGroups.filter((g) => g.pendingDue > 0).length,
    [tournamentGroups]
  );
  const groupsCleared = useMemo(
    () => tournamentGroups.filter((g) => g.pendingDue <= 0).length,
    [tournamentGroups]
  );

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (collapse: boolean) => {
    const next: Record<string, boolean> = {};
    tournamentGroups.forEach((g) => {
      next[g.id] = collapse;
    });
    setCollapsedGroups(next);
  };

  if (loading) {
    return (
      <>
        <Header
          title="Player Profile & Ledger"
          subtitle="Match fee history, dues collection, and performance records"
        />
        <div className="content-body">
          <DetailPageSkeleton />
        </div>
      </>
    );
  }

  if (!player) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Player profile not found. <Link href="/players">Back to Players</Link>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Player Profile & Ledger"
        subtitle="Match fee history, dues collection, and performance records"
      />

      <div className="player-detail-compact-container">
        <DetailNav back={{ href: "/players", label: "Back to Players" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsReturnOpen(true)}
          >
            Return / Payout Money
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Profile
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeletePlayer}
          >
            Deactivate
          </Button>
        </DetailNav>

        {/* Single Integrated Player Overview & KPI Banner */}
        <div className="player-profile-unified-card">
          <div className="player-unified-left">
            <Avatar
              name={player.name}
              label={player.jerseyNumber ? `#${player.jerseyNumber}` : undefined}
              size="lg"
            />

            <div className="player-unified-details">
              <div className="player-unified-title-row">
                <h1 className="player-unified-name">{player.name}</h1>
                <Badge variant="purple" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                  {formatLabel(player.role)}
                </Badge>
                {momAwards.length > 0 && (
                  <Badge variant="warning" style={{ fontSize: '10.5px' }}>
                    {momAwards.length} MOM
                  </Badge>
                )}
              </div>

              <div className="player-unified-meta-row">
                {player.phone && (
                  <span>
                    <strong>{player.phone}</strong>
                  </span>
                )}
                {player.email && <span>{player.email}</span>}
                {player.battingStyle && <span>{formatLabel(player.battingStyle)}</span>}
                {player.bowlingStyle && <span>{formatLabel(player.bowlingStyle)}</span>}
                {(player.kitSizeChest || player.kitSizeTrouser) && (
                  <span className="compact-kit-badge">
                    Kit: Chest {player.kitSizeChest || '-'} / Trouser {player.kitSizeTrouser || '-'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inline 6 KPI Mini Chips: Matches, Tournaments, Assigned, Paid, Returned, Due */}
          <div className="player-unified-kpi-row" style={{ flexWrap: 'wrap' }}>
            <div className="kpi-chip">
              <span className="kpi-chip-label">Matches</span>
              <span className="kpi-chip-val">{matchHistory.length}</span>
            </div>

            <div className="kpi-chip">
              <span className="kpi-chip-label">Tournaments</span>
              <span className="kpi-chip-val" style={{ color: 'var(--accent-purple)' }}>
                {data?.ledger?.tournamentsCount || availableTournaments.length}
              </span>
            </div>

            <div className="kpi-chip">
              <span className="kpi-chip-label">Fee Assigned</span>
              <span className="kpi-chip-val">Rs. {formatNumber(totalAssigned)}</span>
            </div>

            <div className="kpi-chip kpi-chip-paid">
              <span className="kpi-chip-label">Fee Paid</span>
              <span className="kpi-chip-val">Rs. {formatNumber(totalPaid)}</span>
            </div>

            <div className="kpi-chip" style={{ background: '#e2e8f0', borderColor: '#94a3b8' }}>
              <span className="kpi-chip-label" style={{ color: '#334155' }}>Returned</span>
              <span className="kpi-chip-val" style={{ color: '#334155' }}>Rs. {formatNumber(totalReturned)}</span>
            </div>

            <div className={`kpi-chip ${isCleared ? 'kpi-chip-cleared' : 'kpi-chip-due'}`}>
              <span className="kpi-chip-label">Balance Due</span>
              <span className="kpi-chip-val">
                {isCleared ? 'CLEARED' : `Rs. ${formatNumber(pendingDue)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Tournament-Wise Separate Ledger Boxes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
          {/* Tournament Overview & Filter Controls Bar */}
          <div
            style={{
              padding: '12px 16px',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Left: Section Title & Quick Status Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Tournament Ledgers ({tournamentGroups.length})
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Individual ledger box for each tournament played by {player.name}
                </div>
              </div>

              {/* Status Tabs */}
              <SegmentedTabs
                value={tourneyFilterTab}
                onChange={setTourneyFilterTab}
                tabs={[
                  { value: 'all', label: 'All', count: tournamentGroups.length },
                  { value: 'due', label: 'Pending Due', count: groupsWithDue, tone: 'pending' },
                  { value: 'cleared', label: 'Cleared', count: groupsCleared, tone: 'cleared' },
                ]}
              />
            </div>

            {/* Right: Search + Collapse/Expand + Clear All Dues */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div className="ledger-search-wrap" style={{ width: '200px' }}>
                <Search size={13} className="ledger-search-icon" />
                <input
                  type="text"
                  placeholder="Filter tourney, team..."
                  className="ledger-search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="ledger-clear-search"
                    onClick={() => setSearchTerm('')}
                  >
                    ×
                  </button>
                )}
              </div>

              <ViewSwitcher
                viewMode={viewMode}
                onChange={setViewMode}
                gridLabel="Boxes"
                tableLabel="Table"
              />

              {viewMode === 'table' && (
                <div style={{ display: 'inline-flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => toggleAll(false)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    title="Expand all tournament boxes"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleAll(true)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                    title="Collapse all tournament boxes"
                  >
                    Collapse All
                  </button>
                </div>
              )}

              {pendingDue > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleClearAllPendingDues}
                  style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Clear All (Rs. {formatNumber(pendingDue)})
                </Button>
              )}
            </div>
          </div>

          {/* Render Tournament Boxes: Grid View (Default) or Table View */}
          {displayedGroups.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'var(--text-muted)',
                fontSize: '13px',
              }}
            >
              No tournaments or matches found matching your filters.
            </div>
          ) : viewMode === 'grid' ? (
            /* ==========================================================
               GRID VIEW: CARDS / BOXES WITH TOP TOURNAMENT & BOTTOM PAYMENT
               ========================================================== */
            <div className="tournament-ledger-grid">
              {displayedGroups.map((grp) => {
                const isAllPaid = grp.pendingDue <= 0;
                const isExpanded = Boolean(expandedMatches[grp.id]);
                const matchesToShow = isExpanded ? grp.matches : grp.matches.slice(0, 2);

                return (
                  <div
                    key={grp.id}
                    className={`tourney-box-card ${!isAllPaid ? 'has-due' : 'is-cleared'}`}
                  >
                    {/* TOP: Tournament Details */}
                    <div className="tourney-box-header">
                      <div className="tourney-box-title-row">
                        <div className="tourney-box-identity">
                          <div className={`tourney-box-icon ${grp.isFriendly ? 'friendly' : 'tourney'}`}>
                            {grp.isFriendly ? 'F' : 'T'}
                          </div>
                          <div className="tourney-box-info">
                            {!grp.isFriendly ? (
                              <Link href={`/tournaments/${grp.id}`} className="tourney-box-name">
                                <span>{grp.name}</span>
                              </Link>
                            ) : (
                              <span className="tourney-box-name">{grp.name}</span>
                            )}
                            <div className="tourney-box-meta">
                              <span className="tourney-pill-tag">
                                {grp.matches.length} {grp.matches.length === 1 ? 'Match' : 'Matches'}
                              </span>
                              {grp.format && <span className="tourney-pill-tag">{grp.format}</span>}
                              {grp.year && <span className="tourney-pill-tag">Season {grp.year}</span>}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tournament Financial ROI & Status Banner */}
                      {!grp.isFriendly && grp.tourneyFinancials && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '8px',
                            paddingTop: '2px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              className={`tourney-roi-badge ${
                                grp.tourneyFinancials.netPnl >= 0 ? 'roi-profit' : 'roi-loss'
                              }`}
                            >
                              {grp.tourneyFinancials.netPnl >= 0 ? '+' : ''}Rs. {formatNumber(grp.tourneyFinancials.netPnl)}{' '}
                              {grp.tourneyFinancials.netPnl >= 0 ? 'Profit' : 'Loss'}
                            </span>
                            {((grp.tourneyFinancials.actualWinningPrizeWon || 0) + (grp.tourneyFinancials.matchPrizeWon || 0)) > 0 && (
                              <span style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600 }}>
                                Prize: Rs. {formatNumber(((grp.tourneyFinancials.actualWinningPrizeWon || 0) + (grp.tourneyFinancials.matchPrizeWon || 0)))}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* MIDDLE: Matches List */}
                    <div className="tourney-box-matches-section">
                      <div className="tourney-box-matches-label">
                        <span>Squad Matches ({grp.matches.length})</span>
                        {grp.matches.length > 2 && (
                          <button
                            type="button"
                            onClick={() => toggleMatchExpansion(grp.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--accent-blue)',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: 0,
                            }}
                          >
                            {isExpanded ? '▲ Show Less' : `▼ View All (${grp.matches.length})`}
                          </button>
                        )}
                      </div>

                      <div className="tourney-matches-list">
                        {matchesToShow.map((rec: any) => {
                          const match = rec.matchId;
                          const isMOM = momAwards.some((a) => a.matchId?._id === match?._id);
                          const matchDue = (rec.feeAssigned || 0) - (rec.feePaid || 0);
                          const isPaid = rec.paymentStatus === 'paid';

                          return (
                            <div
                              key={rec._id}
                              className={`tourney-match-item ${!isPaid ? 'match-unpaid' : ''}`}
                            >
                              <div className="tourney-match-left">
                                <div className="tourney-match-details">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    {match ? (
                                      <Link href={`/matches/${match._id}`} className="tourney-match-opponent">
                                        <span>vs {match.opponentTeam || 'Opponent'}</span>
                                      </Link>
                                    ) : (
                                      <span style={{ fontWeight: 700 }}>Match</span>
                                    )}
                                    {match?.tournamentStage && match.tournamentStage !== 'regular' && (
                                      <Badge
                                        variant="primary"
                                        style={{ fontSize: '9.5px', padding: '1px 5px', textTransform: 'capitalize' }}
                                      >
                                        {match.tournamentStage.replace(/_/g, ' ')}
                                      </Badge>
                                    )}
                                    {isMOM && (
                                      <Badge
                                        variant="warning"
                                        style={{ fontSize: '9.5px', padding: '1px 5px' }}
                                      >
                                        MOM
                                      </Badge>
                                    )}
                                    {match?.result && (
                                      <Badge
                                        variant={match.result === 'won' ? 'success' : 'danger'}
                                        style={{ fontSize: '9.5px', padding: '1px 4px' }}
                                      >
                                        {match.result.toUpperCase()}
                                      </Badge>
                                    )}
                                  </div>

                                  <div className="tourney-match-sub">
                                    <span>
                                      {match?.matchDate
                                        ? formatDate(match.matchDate, 'N/A')
                                        : 'N/A'}
                                    </span>
                                    {match?.venue && (
                                      <>
                                        <span>•</span>
                                        <span>{match.venue}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="tourney-match-right">
                                <div style={{ textAlign: 'right' }}>
                                  <div
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '12px',
                                      color: isPaid ? 'var(--accent-green)' : 'var(--accent-rose)',
                                    }}
                                  >
                                    {isPaid ? `Rs. ${formatNumber(rec.feePaid)}` : `Rs. ${formatNumber(matchDue)} Due`}
                                  </div>
                                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                    Fee: Rs. {formatNumber(rec.feeAssigned)}
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {!isPaid && (
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleQuickMarkPaid(rec._id, rec.feeAssigned)}
                                      title="Mark Match Fee as Paid"
                                      style={{ height: '26px', padding: '0 7px', fontSize: '11px' }}
                                    >
                                      Pay
                                    </Button>
                                  )}
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    icon={<PencilIcon size={11} />}
                                    onClick={() => setEditingPayment(rec)}
                                    title="Edit Match Payment"
                                    style={{ height: '26px', padding: '0 6px' }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BOTTOM: Payment Details */}
                    <div className="tourney-box-payment-section">
                      <div className="tourney-payment-grid">
                        <div className="tourney-pay-tile">
                          <span className="tourney-pay-label">Assigned</span>
                          <span className="tourney-pay-val">Rs. {formatNumber(grp.totalAssigned)}</span>
                        </div>

                        <div className="tourney-pay-tile">
                          <span className="tourney-pay-label">Paid</span>
                          <span className="tourney-pay-val paid">Rs. {formatNumber(grp.totalPaid)}</span>
                        </div>

                        <div className="tourney-pay-tile">
                          <span className="tourney-pay-label">Returned</span>
                          <span className={`tourney-pay-val ${grp.totalReturned > 0 ? 'returned' : ''}`}>
                            Rs. {formatNumber(grp.totalReturned)}
                          </span>
                        </div>

                        <div className={`tourney-pay-tile ${grp.pendingDue > 0 ? 'tile-due' : 'tile-cleared'}`}>
                          <span className="tourney-pay-label">Due</span>
                          <span className={`tourney-pay-val ${grp.pendingDue > 0 ? 'due' : 'paid'}`}>
                            Rs. {formatNumber(grp.pendingDue)}
                          </span>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="tourney-box-footer-actions">
                        <div>
                          {grp.returns.length > 0 && (
                            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                              Rs. {formatNumber(grp.totalReturned)} returned/prize
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {grp.pendingDue > 0 && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleClearGroupPendingDues(grp)}
                              style={{ fontWeight: 700 }}
                            >
                              Clear Dues (Rs. {formatNumber(grp.pendingDue)})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Mode */
            displayedGroups.map((grp) => {
              const isCollapsed = Boolean(collapsedGroups[grp.id]);

              return (
                <div
                  key={grp.id}
                  className="compact-ledger-card"
                  style={{
                    border: grp.pendingDue > 0 ? '1px solid #e2e8f0' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    boxShadow: '0 2px 5px rgba(15, 23, 42, 0.04)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Tournament Box Header */}
                  <div
                    style={{
                      padding: '12px 18px',
                      background: grp.pendingDue > 0 ? '#fff8f8' : '#f8fafc',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                    onClick={() => toggleGroup(grp.id)}
                  >
                    {/* Left: Tournament Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: grp.isFriendly ? '#f1f5f9' : '#f1f5f9',
                          color: grp.isFriendly ? '#475569' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '16px',
                          flexShrink: 0,
                          border: grp.isFriendly ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                        }}
                      >
                        {grp.isFriendly ? 'F' : 'T'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h3
                            style={{
                              fontSize: '14.5px',
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              margin: 0,
                            }}
                          >
                            {grp.name}
                          </h3>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#e2e8f0',
                              color: 'var(--text-secondary)',
                              padding: '2px 8px',
                              borderRadius: '12px',
                            }}
                          >
                            {grp.matches.length} {grp.matches.length === 1 ? 'Match' : 'Matches'}
                          </span>
                          {grp.totalReturned > 0 && (
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                background: '#e2e8f0',
                                border: '1px solid #94a3b8',
                                color: '#334155',
                                padding: '2px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              Rs. {formatNumber(grp.totalReturned)} Returned / Prize
                            </span>
                          )}
                        </div>
                        {grp.year && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Tournament Season: {grp.year}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Tournament Financials & Actions */}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '11.5px',
                          flexWrap: 'wrap',
                          background: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <span style={{ color: 'var(--text-muted)' }}>
                          Assigned: <strong style={{ color: 'var(--text-primary)' }}>Rs. {formatNumber(grp.totalAssigned)}</strong>
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Paid: <strong style={{ color: 'var(--accent-green)' }}>Rs. {formatNumber(grp.totalPaid)}</strong>
                        </span>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: 'var(--text-muted)' }}>
                          Return:{' '}
                          <strong
                            style={{
                              color: grp.totalReturned > 0 ? '#334155' : 'var(--text-muted)',
                              background: grp.totalReturned > 0 ? '#e2e8f0' : 'transparent',
                              padding: grp.totalReturned > 0 ? '1px 5px' : '0',
                              borderRadius: '4px',
                            }}
                          >
                            Rs. {formatNumber(grp.totalReturned)}
                          </strong>
                        </span>
                        {!grp.isFriendly && grp.tourneyFinancials && (
                          <>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              Profit / Loss:{' '}
                              <strong
                                style={{
                                  color: grp.tourneyFinancials.netPnl >= 0 ? '#166534' : '#dc2626',
                                  background: grp.tourneyFinancials.netPnl >= 0 ? '#e2e8f0' : '#f1f5f9',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                }}
                              >
                                {grp.tourneyFinancials.netPnl >= 0 ? '+' : ''}Rs. {formatNumber(grp.tourneyFinancials.netPnl)}
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    marginLeft: '3px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    opacity: 0.9,
                                  }}
                                >
                                  ({grp.tourneyFinancials.netPnl >= 0 ? 'Profit' : 'Loss'})
                                </span>
                              </strong>
                            </span>
                            {((grp.tourneyFinancials.actualWinningPrizeWon || 0) + (grp.tourneyFinancials.matchPrizeWon || 0)) > 0 && (
                              <>
                                <span style={{ color: '#cbd5e1' }}>•</span>
                                <span style={{ color: 'var(--text-muted)' }}>
                                  Prize:{' '}
                                  <strong style={{ color: '#334155' }}>
                                    Rs. {formatNumber(((grp.tourneyFinancials.actualWinningPrizeWon || 0) + (grp.tourneyFinancials.matchPrizeWon || 0)))}
                                  </strong>
                                </span>
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <div>
                        {grp.pendingDue > 0 ? (
                          <Badge
                            variant="danger"
                            style={{ fontSize: '11px', padding: '3px 9px', fontWeight: 700 }}
                          >
                            Rs. {formatNumber(grp.pendingDue)} Due
                          </Badge>
                        ) : (
                          <Badge
                            variant="success"
                            style={{ fontSize: '11px', padding: '3px 9px' }}
                          >
                            Fully Cleared
                          </Badge>
                        )}
                      </div>

                      {grp.pendingDue > 0 && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleClearGroupPendingDues(grp)}
                          style={{ padding: '3px 8px', fontSize: '11px' }}
                          title={`Clear all pending match dues for ${grp.name}`}
                        >
                          Clear Dues
                        </Button>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleGroup(grp.id)}
                        style={{
                          background: 'transparent',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: 'var(--text-secondary)',
                        }}
                        title={isCollapsed ? 'Expand Tournament Box' : 'Collapse Tournament Box'}
                      >
                        {isCollapsed ? '▼' : '▲'}
                      </button>
                    </div>
                  </div>

                  {/* Tournament Financial Highlights Bar when expanded */}
                  {!isCollapsed && !grp.isFriendly && grp.tourneyFinancials && (
                    <div
                      style={{
                        padding: '9px 18px',
                        background: '#f8fafc',
                        borderBottom: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                        fontSize: '11.5px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          <strong>Total Invested:</strong> Rs. {formatNumber(grp.tourneyFinancials.totalInvested)}{' '}
                          <span style={{ color: '#94a3b8', fontSize: '10.5px' }}>
                            (Entry: Rs. {formatNumber(grp.tourneyFinancials.entryFee)} + Expenses: Rs. {formatNumber(grp.tourneyFinancials.tournamentExpenses + grp.tourneyFinancials.matchExpenses)})
                          </span>
                        </span>
                      </div>

                      <Link
                        href={`/tournaments/${grp.id}`}
                        style={{
                          fontSize: '11px',
                          color: 'var(--accent-blue)',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none',
                        }}
                      >
                        <span>Full Tournament ROI Ledger</span>
                      </Link>
                    </div>
                  )}

                  {/* Box Body (Matches DataTable) */}
                  {!isCollapsed && (
                    <div className="compact-table-container">
                      <DataTable
                        data={grp.matches}
                        keyExtractor={(rec: any) => rec._id}
                        className="compact-table"
                        rowClassName={(rec: any) => {
                          const due = (rec.feeAssigned || 0) - (rec.feePaid || 0);
                          return due > 0 ? 'row-pending-due' : '';
                        }}
                        emptyMessage="No matches recorded for this tournament."
                        columns={getPlayerMatchFeeColumns({ momAwards, handleQuickMarkPaid, setEditingPayment })}
                      />
                    </div>
                  )}

                  {/* Tournament Return Note if any returns linked to this tournament */}
                  {grp.returns.length > 0 && !isCollapsed && (
                    <div
                      style={{
                        padding: '8px 16px',
                        background: '#f1f5f9',
                        borderTop: '1px solid #94a3b8',
                        fontSize: '11.5px',
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        <strong>Tournament Payouts & Returns:</strong> Rs. {formatNumber(grp.totalReturned)} returned/distributed to {player.name} for this tournament.
                      </span>
                      <span style={{ fontSize: '11px', color: '#334155' }}>
                        {grp.returns.length} {grp.returns.length === 1 ? 'record' : 'records'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Returns & Refunds History Section */}
        <div className="compact-ledger-card" style={{ marginTop: '16px' }}>
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Returns, Refunds & Payouts
              </h2>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Track fee refunds, prize money shares, and sponsor funds distributed back to {player.name}
              </div>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsReturnOpen(true)}
              style={{ fontWeight: 700, background: '#e2e8f0', borderColor: '#94a3b8', color: '#334155' }}
            >
              Issue Return / Refund
            </Button>
          </div>

          <div style={{ padding: '0' }}>
            <DataTable
              data={playerReturns}
              keyExtractor={(ret: any) => ret._id}
              emptyMessage="No return or payout records for this player yet."
              columns={getPlayerReturnColumns({ handleDeleteReturn })}
            />
          </div>
        </div>
      </div>

      {/* Edit Player Profile Modal */}
      <EditPlayerModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        player={player}
        onSuccess={invalidatePlayerData}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        payment={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSuccess={invalidatePlayerData}
      />

      {/* Return/Payout Modal */}
      <PlayerReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        player={{
          ...player,
          totalFeeAssigned: totalAssigned,
          totalFeePaid: totalPaid,
          totalReturned,
          pendingDue,
        }}
        tournaments={availableTournaments.map((t) => ({ _id: t.id, name: t.name }))}
        onSuccess={invalidatePlayerData}
      />
    </>
  );
}
