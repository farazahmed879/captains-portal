'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { fetchApi } from '../../../lib/api';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  Modal,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Pagination,
} from '../../../components/ui';
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  ArrowLeftIcon,
  DollarIcon,
  AwardIcon,
  SwordsIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShirtIcon,
  CalendarIcon,
  ExternalLinkIcon,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
} from '../../../components/icons';

type LedgerStatusFilter = 'all' | 'pending' | 'cleared' | 'mom';

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters for ledger
  const [statusFilter, setStatusFilter] = useState<LedgerStatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [tournamentFilter, setTournamentFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '30days' | '90days' | '2026' | 'custom'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'due_high' | 'fee_high'>('newest');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Edit Player Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'all_rounder',
    battingStyle: 'right_hand',
    bowlingStyle: 'right_arm_medium',
    jerseyNumber: 0,
    kitSizeChest: '',
    kitSizeTrouser: '',
    notes: '',
  });

  // Edit Payment Modal state
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    feePaid: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  const loadPlayerProfile = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{ success: boolean; player: any; ledger: any }>(`/players/${id}`)
      .then((res) => {
        if (res.success) {
          setData(res);
          const p = res.player;
          setEditFormData({
            name: p.name || '',
            phone: p.phone || '',
            email: p.email || '',
            role: p.role || 'all_rounder',
            battingStyle: p.battingStyle || 'right_hand',
            bowlingStyle: p.bowlingStyle || 'right_arm_medium',
            jerseyNumber: p.jerseyNumber || 0,
            kitSizeChest: p.kitSizeChest || '',
            kitSizeTrouser: p.kitSizeTrouser || '',
            notes: p.notes || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlayerProfile();
  }, [id]);

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to update player');
    }
  };

  const handleDeletePlayer = async () => {
    if (!confirm(`Are you sure you want to deactivate player "${data?.player?.name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/players');
      }
    } catch (err) {
      alert('Failed to deactivate player');
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
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleClearAllPendingDues = async () => {
    const pendingList = matchHistory.filter((p: any) => p.paymentStatus !== 'paid');
    if (pendingList.length === 0) return;
    if (!confirm(`Clear all ${pendingList.length} pending match fees (Total Rs. ${fNum(pendingDue)}) for ${player.name}?`)) return;
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
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to clear pending dues');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${editingPayment._id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentFormData),
      });
      if (res.success) {
        setEditingPayment(null);
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to update payment record');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');
  const formatStyle = (val?: string) =>
    val ? val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  // Filtered & sorted ledger matches
  const matchHistory: any[] = data?.ledger?.matchHistory || [];
  const momAwards: any[] = data?.ledger?.momAwards || [];
  const totalAssigned = data?.ledger?.totalFeeAssigned || 0;
  const totalPaid = data?.ledger?.totalFeePaid || 0;
  const pendingDue = data?.ledger?.pendingDue || 0;
  const isCleared = pendingDue <= 0;
  const player = data?.player;

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

  const availableTeams = useMemo(() => {
    const map = new Map<string, string>();
    matchHistory.forEach((rec) => {
      const tm = rec.matchId?.teamId;
      if (tm?._id && tm?.name) {
        map.set(tm._id, tm.name);
      }
    });
    (player?.teamIds || []).forEach((tm: any) => {
      if (tm?._id && tm?.name) {
        map.set(tm._id, tm.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [matchHistory, player]);

  const hasActiveFilters = useMemo(() => {
    return (
      statusFilter !== 'all' ||
      tournamentFilter !== 'all' ||
      teamFilter !== 'all' ||
      dateFilter !== 'all' ||
      Boolean(dateFrom) ||
      Boolean(dateTo) ||
      methodFilter !== 'all' ||
      searchTerm.trim() !== '' ||
      sortBy !== 'newest'
    );
  }, [statusFilter, tournamentFilter, teamFilter, dateFilter, dateFrom, dateTo, methodFilter, searchTerm, sortBy]);

  const handleResetFilters = () => {
    setStatusFilter('all');
    setTournamentFilter('all');
    setTeamFilter('all');
    setDateFilter('all');
    setDateFrom('');
    setDateTo('');
    setMethodFilter('all');
    setSearchTerm('');
    setSortBy('newest');
    setCurrentPage(1);
  };

  const filteredMatches = useMemo(() => {
    return matchHistory
      .filter((rec) => {
        const match = rec.matchId;

        // 1. Status filter (All, Pending, Cleared, MOM)
        if (statusFilter === 'pending' && rec.paymentStatus === 'paid') return false;
        if (statusFilter === 'cleared' && rec.paymentStatus !== 'paid') return false;
        if (statusFilter === 'mom' && !momAwards.some((a) => a.matchId?._id === match?._id)) return false;

        // 2. Tournament-wise filter
        if (tournamentFilter !== 'all') {
          const tId = match?.tournamentId?._id || match?.tournamentId;
          if (tId !== tournamentFilter) return false;
        }

        // 3. Team-wise filter
        if (teamFilter !== 'all') {
          const tmId = match?.teamId?._id || match?.teamId;
          if (tmId !== teamFilter) return false;
        }

        // 4. Date-wise filter
        if (dateFilter !== 'all' && match?.matchDate) {
          const mTime = new Date(match.matchDate).getTime();
          const now = Date.now();
          if (dateFilter === '30days' && mTime < now - 30 * 86400000) return false;
          if (dateFilter === '90days' && mTime < now - 90 * 86400000) return false;
          if (dateFilter === '2026') {
            const yStart = new Date('2026-01-01').getTime();
            const yEnd = new Date('2026-12-31T23:59:59').getTime();
            if (mTime < yStart || mTime > yEnd) return false;
          }
          if (dateFilter === 'custom') {
            if (dateFrom && mTime < new Date(dateFrom).getTime()) return false;
            if (dateTo && mTime > new Date(`${dateTo}T23:59:59`).getTime()) return false;
          }
        }

        // 5. Payment method filter
        if (methodFilter !== 'all') {
          const m = (rec.paymentMethod || 'cash').toLowerCase();
          if (methodFilter === 'cash' && m !== 'cash') return false;
          if (methodFilter === 'online' && m !== 'online' && m !== 'bank') return false;
          if (methodFilter === 'sponsor' && !m.includes('sponsor')) return false;
        }

        // 6. Search text
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const opp = (match?.opponentTeam || '').toLowerCase();
          const tourney = (match?.tournamentId?.name || '').toLowerCase();
          const teamName = (match?.teamId?.name || '').toLowerCase();
          const notes = (rec.notes || '').toLowerCase();
          if (
            !opp.includes(term) &&
            !tourney.includes(term) &&
            !teamName.includes(term) &&
            !notes.includes(term)
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.matchId?.matchDate || 0).getTime() - new Date(a.matchId?.matchDate || 0).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.matchId?.matchDate || 0).getTime() - new Date(b.matchId?.matchDate || 0).getTime();
        }
        if (sortBy === 'due_high') {
          const dueA = (a.feeAssigned || 0) - (a.feePaid || 0);
          const dueB = (b.feeAssigned || 0) - (b.feePaid || 0);
          return dueB - dueA;
        }
        if (sortBy === 'fee_high') {
          return (b.feeAssigned || 0) - (a.feeAssigned || 0);
        }
        return 0;
      });
  }, [
    matchHistory,
    statusFilter,
    tournamentFilter,
    teamFilter,
    dateFilter,
    dateFrom,
    dateTo,
    methodFilter,
    searchTerm,
    sortBy,
    momAwards,
  ]);

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;
  const paginatedMatches = useMemo(() => {
    return filteredMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Player Profile...
      </div>
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
        {/* Top Navigation & Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/players" className="btn btn-secondary btn-sm compact-back-btn">
            <ArrowLeftIcon size={13} />
            <span>Back to Players</span>
          </Link>

          <div className="action-group" style={{ gap: '6px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<PencilIcon size={12} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Profile
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<TrashIcon size={12} />}
              onClick={handleDeletePlayer}
            >
              Deactivate
            </Button>
          </div>
        </div>

        {/* Single Integrated Player Overview & KPI Banner */}
        <div className="player-profile-unified-card">
          <div className="player-unified-left">
            <div className="player-unified-avatar">
              {player.jerseyNumber ? `#${player.jerseyNumber}` : player.name.slice(0, 2).toUpperCase()}
            </div>

            <div className="player-unified-details">
              <div className="player-unified-title-row">
                <h1 className="player-unified-name">{player.name}</h1>
                <Badge variant="purple" style={{ textTransform: 'capitalize', fontSize: '11px' }}>
                  {formatStyle(player.role)}
                </Badge>
                <span className="compact-team-tag">Gulzar CC</span>
                {momAwards.length > 0 && (
                  <Badge variant="warning" icon={<AwardIcon size={10} />} style={{ fontSize: '10.5px' }}>
                    {momAwards.length} MOM
                  </Badge>
                )}
              </div>

              <div className="player-unified-meta-row">
                {player.phone && (
                  <span>
                    <PhoneIcon size={11} color="var(--accent-blue)" style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                    <strong>{player.phone}</strong>
                  </span>
                )}
                {player.email && <span>{player.email}</span>}
                {player.battingStyle && <span>🏏 {formatStyle(player.battingStyle)}</span>}
                {player.bowlingStyle && <span>⚡ {formatStyle(player.bowlingStyle)}</span>}
                {(player.kitSizeChest || player.kitSizeTrouser) && (
                  <span className="compact-kit-badge">
                    Kit: Chest {player.kitSizeChest || '-'} / Trouser {player.kitSizeTrouser || '-'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Inline 4 KPI Mini Chips */}
          <div className="player-unified-kpi-row">
            <div className="kpi-chip">
              <span className="kpi-chip-label">Matches</span>
              <span className="kpi-chip-val">{matchHistory.length}</span>
            </div>

            <div className="kpi-chip">
              <span className="kpi-chip-label">MOM Wins</span>
              <span className="kpi-chip-val" style={{ color: momAwards.length > 0 ? 'var(--accent-amber)' : 'inherit' }}>
                {momAwards.length}
              </span>
            </div>

            <div className="kpi-chip kpi-chip-paid">
              <span className="kpi-chip-label">Fee Paid</span>
              <span className="kpi-chip-val">Rs. {fNum(totalPaid)}</span>
            </div>

            <div className={`kpi-chip ${isCleared ? 'kpi-chip-cleared' : 'kpi-chip-due'}`}>
              <span className="kpi-chip-label">Balance Due</span>
              <span className="kpi-chip-val">
                {isCleared ? 'CLEARED' : `Rs. ${fNum(pendingDue)}`}
              </span>
            </div>
          </div>
        </div>

        {/* Concise Match Fee Ledger Card */}
        <div className="compact-ledger-card">
          {/* Primary Filter Toolbar: Status tabs + Search + Clear All */}
          <div className="ledger-filter-toolbar">
            {/* Left: Filter Tabs */}
            <div className="ledger-tab-group">
              <button
                type="button"
                className={`ledger-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                All ({matchHistory.length})
              </button>
              <button
                type="button"
                className={`ledger-tab tab-pending ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('pending');
                  setCurrentPage(1);
                }}
              >
                Pending Due ({pendingMatchesCount})
              </button>
              <button
                type="button"
                className={`ledger-tab tab-cleared ${statusFilter === 'cleared' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('cleared');
                  setCurrentPage(1);
                }}
              >
                Cleared ({clearedMatchesCount})
              </button>
              {momAwards.length > 0 && (
                <button
                  type="button"
                  className={`ledger-tab tab-mom ${statusFilter === 'mom' ? 'active' : ''}`}
                  onClick={() => {
                    setStatusFilter('mom');
                    setCurrentPage(1);
                  }}
                >
                  MOM ({momAwards.length})
                </button>
              )}
            </div>

            {/* Right: Search + Action */}
            <div className="ledger-filter-right">
              <div className="ledger-search-wrap" style={{ width: '220px' }}>
                <Search size={13} className="ledger-search-icon" />
                <input
                  type="text"
                  placeholder="Filter opponent, tourney..."
                  className="ledger-search-input"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="ledger-clear-search"
                    onClick={() => {
                      setSearchTerm('');
                      setCurrentPage(1);
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {pendingDue > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircleIcon size={12} />}
                  onClick={handleClearAllPendingDues}
                  style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                >
                  Clear All (Rs. {fNum(pendingDue)})
                </Button>
              )}
            </div>
          </div>

          {/* Secondary Subbar: Tournament-wise, Team-wise, Date-wise, Payment Method, Sort */}
          <div className="ledger-filter-subbar">
            {/* Tournament-wise Filter */}
            <div className="ledger-filter-item">
              <span className="ledger-filter-label">Tourney:</span>
              <select
                className="ledger-select"
                value={tournamentFilter}
                onChange={(e) => {
                  setTournamentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '130px' }}
              >
                <option value="all">🏆 All Tournaments</option>
                {availableTournaments.map((trn) => (
                  <option key={trn.id} value={trn.id}>
                    {trn.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Team-wise Filter */}
            <div className="ledger-filter-item">
              <span className="ledger-filter-label">Team:</span>
              <select
                className="ledger-select"
                value={teamFilter}
                onChange={(e) => {
                  setTeamFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '120px' }}
              >
                <option value="all">🛡️ All Teams</option>
                {availableTeams.map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date-wise Filter */}
            <div className="ledger-filter-item">
              <span className="ledger-filter-label">Date:</span>
              <select
                className="ledger-select"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '120px' }}
              >
                <option value="all">📅 All Dates</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 3 Months</option>
                <option value="2026">2026 Season</option>
                <option value="custom">Custom Range...</option>
              </select>
            </div>

            {/* Custom Date Inputs if custom selected */}
            {dateFilter === 'custom' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="date"
                  className="ledger-date-input"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  title="Start Date"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>to</span>
                <input
                  type="date"
                  className="ledger-date-input"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  title="End Date"
                />
              </div>
            )}

            {/* Payment Method Filter */}
            <div className="ledger-filter-item">
              <span className="ledger-filter-label">Method:</span>
              <select
                className="ledger-select"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '110px' }}
              >
                <option value="all">💳 All Methods</option>
                <option value="cash">Cash</option>
                <option value="online">Online / Bank</option>
                <option value="sponsor">Sponsor</option>
              </select>
            </div>

            {/* Sort Order */}
            <div className="ledger-filter-item">
              <span className="ledger-filter-label">Sort:</span>
              <select
                className="ledger-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '120px' }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="due_high">Due (High)</option>
                <option value="fee_high">Fee (High)</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetFilters}
                style={{ padding: '3px 9px', fontSize: '11px', color: '#be123c', marginLeft: 'auto' }}
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* High-Density Match Fee Table with Sticky Header */}
          <div className="compact-table-container">
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Match, Tournament & Team</th>
                  <th style={{ width: '12%' }}>Date</th>
                  <th style={{ width: '12%' }}>Fee Assigned</th>
                  <th style={{ width: '12%' }}>Fee Paid</th>
                  <th style={{ width: '11%' }}>Due</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      No match fees match the selected filters.
                      {hasActiveFilters && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ marginLeft: '12px' }}
                          onClick={handleResetFilters}
                        >
                          Reset Filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedMatches.map((rec) => {
                    const match = rec.matchId;
                    const isPaid = rec.paymentStatus === 'paid';
                    const due = (rec.feeAssigned || 0) - (rec.feePaid || 0);
                    const isMOM = momAwards.some((a) => a.matchId?._id === match?._id);

                    return (
                      <tr key={rec._id} className={due > 0 ? 'row-pending-due' : ''}>
                        <td>
                          <div className="cell-match-row">
                            {match ? (
                              <Link
                                href={`/matches/${match._id}`}
                                className="cell-match-link"
                              >
                                <span>vs {match.opponentTeam || 'Opponent'}</span>
                                <ExternalLinkIcon size={10} color="var(--accent-blue)" />
                              </Link>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Match</span>
                            )}

                            {match?.tournamentId?.name && (
                              <span className="badge-tourney-pill" title="Tournament">
                                🏆 {match.tournamentId.name}
                              </span>
                            )}

                            {match?.teamId?.name && (
                              <span className="badge-team-pill" title="Team">
                                🛡️ {match.teamId.shortName || match.teamId.name}
                              </span>
                            )}

                            {isMOM && (
                              <span className="badge-mom-pill" title="Man of the Match">
                                <AwardIcon size={10} />
                                MOM
                              </span>
                            )}

                            {match?.result && (
                              <span
                                className={`cell-match-result ${
                                  match.result === 'won' ? 'res-won' : 'res-lost'
                                }`}
                              >
                                {match.result.toUpperCase()}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="cell-date">
                          {match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="cell-mono">Rs. {fNum(rec.feeAssigned)}</td>

                        <td className="cell-mono cell-paid">
                          Rs. {fNum(rec.feePaid)}
                        </td>

                        <td className="cell-mono">
                          {due > 0 ? (
                            <span className="cell-due-val">Rs. {fNum(due)}</span>
                          ) : (
                            <span className="cell-zero-due">Rs. 0</span>
                          )}
                        </td>

                        <td>
                          <Badge
                            variant={
                              isPaid
                                ? 'success'
                                : rec.paymentStatus === 'partial'
                                ? 'warning'
                                : 'danger'
                            }
                            style={{ fontSize: '10.5px', padding: '2px 7px' }}
                          >
                            {rec.paymentStatus.toUpperCase()}
                          </Badge>
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                            {!isPaid && (
                              <Button
                                variant="success"
                                size="sm"
                                icon={<CheckCircleIcon size={11} />}
                                onClick={() => handleQuickMarkPaid(rec._id, rec.feeAssigned)}
                                title="Mark Fully Paid"
                                style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                              >
                                Paid
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<PencilIcon size={11} />}
                              onClick={() => {
                                setEditingPayment(rec);
                                setPaymentFormData({
                                  feePaid: rec.feePaid || 0,
                                  paymentMethod: rec.paymentMethod || 'cash',
                                  notes: rec.notes || '',
                                });
                              }}
                              style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
                            >
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMatches.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Matches"
          />
        </div>
      </div>

      {/* Edit Player Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Player: ${player.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePlayer}>
              Save Profile Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdatePlayer}>
          <div className="grid-2">
            <Input
              label="Player Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Email Address"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Jersey Number"
              type="number"
              value={editFormData.jerseyNumber}
              onChange={(e) =>
                setEditFormData({ ...editFormData, jerseyNumber: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid-3">
            <Select
              label="Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              options={[
                { value: 'all_rounder', label: 'All Rounder' },
                { value: 'batter', label: 'Batter' },
                { value: 'bowler', label: 'Bowler' },
                { value: 'wicket_keeper', label: 'Wicket Keeper' },
              ]}
            />
            <Select
              label="Batting Style"
              value={editFormData.battingStyle}
              onChange={(e) =>
                setEditFormData({ ...editFormData, battingStyle: e.target.value })
              }
              options={[
                { value: 'right_hand', label: 'Right Hand' },
                { value: 'left_hand', label: 'Left Hand' },
              ]}
            />
            <Select
              label="Bowling Style"
              value={editFormData.bowlingStyle}
              onChange={(e) =>
                setEditFormData({ ...editFormData, bowlingStyle: e.target.value })
              }
              options={[
                { value: 'right_arm_medium', label: 'Right Arm Medium' },
                { value: 'right_arm_fast', label: 'Right Arm Fast' },
                { value: 'right_arm_spin', label: 'Right Arm Spin' },
                { value: 'left_arm_fast', label: 'Left Arm Fast' },
                { value: 'left_arm_spin', label: 'Left Arm Spin' },
              ]}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Kit Size: Chest"
              placeholder="e.g. M, L, 40"
              value={editFormData.kitSizeChest}
              onChange={(e) =>
                setEditFormData({ ...editFormData, kitSizeChest: e.target.value })
              }
            />
            <Input
              label="Kit Size: Trouser"
              placeholder="e.g. 32, 34, L"
              value={editFormData.kitSizeTrouser}
              onChange={(e) =>
                setEditFormData({ ...editFormData, kitSizeTrouser: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Notes"
            rows={2}
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title="Update Match Fee Record"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePayment}>
              Save Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdatePayment}>
          <Input
            label="Fee Assigned"
            type="text"
            value={`Rs. ${fNum(editingPayment?.feeAssigned)}`}
            disabled
          />

          <Input
            label="Fee Paid (Rs.) *"
            type="number"
            value={paymentFormData.feePaid}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, feePaid: Number(e.target.value) })
            }
            required
          />

          <Select
            label="Payment Method"
            value={paymentFormData.paymentMethod}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })
            }
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'online', label: 'Online Transfer / Bank' },
              { value: 'sponsor_covered', label: 'Covered by Sponsor' },
            ]}
          />

          <Input
            label="Notes / Receipt Note"
            type="text"
            value={paymentFormData.notes}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, notes: e.target.value })
            }
          />
        </form>
      </Modal>
    </>
  );
}
