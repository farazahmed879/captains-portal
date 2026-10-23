'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import { confirmDelete, showToast } from '../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Card,
  DataTable,
  Pagination,
  ViewSwitcher,
  Avatar,
  StatBadge,
} from '../../components/ui';
import {
  PLAYER_ROLE_OPTIONS,
  PLAYER_SORT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../../constants';
import { Player } from '../../types';
import { getPlayerColumns } from '../../columns';
import {
  Users,
  Plus,
  Search,
  Phone,
  Trophy,
  CheckCircle2,
  Clock,
  Shield,
  Eye,
  Pencil,
  Trash2,
  ExternalLink,
  DollarIcon,
  AlertCircle,
  Calendar,
} from '../../components/icons';
import { PlayerReturnModal } from '../../components/PlayerReturnModal';
import { RegisterPlayerModal } from '../../components/RegisterPlayerModal';
import { EditPlayerModal } from '../../components/EditPlayerModal';
import { CollectMatchFeeModal } from '../../components/CollectMatchFeeModal';

export default function PlayersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Match Fee Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState<boolean>(false);
  const [selectedPlayerForFee, setSelectedPlayerForFee] = useState<any>(null);

  // Return / Payout Modal state
  const [isReturnOpen, setIsReturnOpen] = useState<boolean>(false);
  const [selectedPlayerForReturn, setSelectedPlayerForReturn] = useState<any>(null);

  // React Queries
  const playersQuery = useQuery({
    queryKey: queryKeys.players({ search, selectedTeamId, roleFilter }),
    queryFn: () => {
      let query = `?search=${encodeURIComponent(search)}`;
      if (selectedTeamId) query += `&teamId=${selectedTeamId}`;
      if (roleFilter) query += `&role=${roleFilter}`;
      return fetchApi<{ success: boolean; players: any[] }>(`/players${query}`);
    },
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const players = playersQuery.data?.players || [];
  const teams = teamsQuery.data?.teams || [];
  const loading = playersQuery.isLoading || teamsQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleEditOpen = (pl: any) => {
    setEditingPlayer(pl);
    setIsEditOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDelete(`player "${name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Player "${name}" deactivated successfully.`);
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to deactivate player.');
    }
  };

  const openFeeModal = (player: any) => {
    setSelectedPlayerForFee(player);
    setIsFeeModalOpen(true);
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'matches'>('name');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Computed metrics
  const pendingCount = useMemo(
    () => players.filter((p) => (p.pendingDue || 0) > 0).length,
    [players]
  );
  const clearedCount = useMemo(
    () => players.filter((p) => (p.pendingDue || 0) <= 0).length,
    [players]
  );
  const totalPendingDue = useMemo(
    () => players.reduce((sum, p) => sum + (p.pendingDue || 0), 0),
    [players]
  );

  // Filtered and sorted players
  const displayedPlayers = useMemo(() => {
    return players
      .filter((pl) => {
        const due = pl.pendingDue || 0;
        if (statusFilter === 'pending' && due <= 0) return false;
        if (statusFilter === 'cleared' && due > 0) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due') return (b.pendingDue || 0) - (a.pendingDue || 0);
        if (sortBy === 'matches') return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [players, statusFilter, sortBy]);

  const totalPages = Math.ceil(displayedPlayers.length / pageSize) || 1;
  const paginatedPlayers = useMemo(() => {
    return displayedPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [displayedPlayers, currentPage, pageSize]);

  const playerColumns = useMemo(
    () =>
      getPlayerColumns({
        onCollectFee: openFeeModal,
        onReturn: (pl: Player) => {
          setSelectedPlayerForReturn(pl);
          setIsReturnOpen(true);
        },
        onEdit: handleEditOpen,
        onDelete: handleDelete,
        fNum,
      }),
    [fNum]
  );

  return (
    <>
      <Header
        title="Player Rosters & Payment Ledgers"
        subtitle="Manage Player Profiles, Fees Assigned vs Paid, and Edit/Delete Player Details"
        selectedTeamId={selectedTeamId}
        onTeamChange={(id) => {
          setSelectedTeamId(id);
          setCurrentPage(1);
        }}
      />

      <div className="content-body" style={{ padding: '14px 24px 28px 24px' }}>
        {/* Concise Filter Bar with Status Tabs & Controls */}
        <div className="filter-bar" style={{ padding: '8px 14px', gap: '10px' }}>
          <div className="filter-bar-left" style={{ gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Status Tabs */}
            <div className="ledger-tab-group">
              <button
                type="button"
                className={`ledger-tab ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
              >
                All Players <span className="tab-count">{players.length}</span>
              </button>
              <button
                type="button"
                className={`ledger-tab tab-pending ${statusFilter === 'pending' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('pending');
                  setCurrentPage(1);
                }}
              >
                Pending Due <span className="tab-count">{pendingCount}</span>
              </button>
              <button
                type="button"
                className={`ledger-tab tab-cleared ${statusFilter === 'cleared' ? 'active' : ''}`}
                onClick={() => {
                  setStatusFilter('cleared');
                  setCurrentPage(1);
                }}
              >
                Cleared <span className="tab-count">{clearedCount}</span>
              </button>
            </div>

            {/* Search Player */}
            <div style={{ width: '220px' }}>
              <Input
                placeholder="Search player name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search size={14} />}
              />
            </div>

            {/* Role Filter */}
            <div style={{ width: '150px' }}>
              <Select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Roles' },
                  ...PLAYER_ROLE_OPTIONS,
                ]}
              />
            </div>

            {/* Sort Dropdown */}
            <div style={{ minWidth: '170px' }}>
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                options={PLAYER_SORT_OPTIONS}
              />
            </div>
          </div>

          <div className="filter-bar-right">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setIsCreateOpen(true)}
            >
              Add Player
            </Button>
          </div>
        </div>

        {/* VIEW 1: HIGH-DENSITY TABLE VIEW */}
        {viewMode === 'table' && (
          <div>
            <DataTable
              data={paginatedPlayers}
              keyExtractor={(pl: any) => pl._id}
              emptyMessage="No players match the selected filters."
              onRowClick={(pl: any) => router.push(`/players/${pl._id}`)}
              columns={playerColumns}
            />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedPlayers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Players"
          />
        </div>
      )}

      {/* VIEW 2: CONCISE COMPACT GRID (High visibility, minimal scrolling) */}
      {viewMode === 'grid' && (
        <div>
          <div className="players-compact-grid">
            {displayedPlayers.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No players match the selected filters.
              </div>
            ) : (
              paginatedPlayers.map((pl) => {
                const due = pl.pendingDue || 0;
                const hasDue = due > 0;

                return (
                  <div
                    key={pl._id}
                    className={`player-compact-card ${hasDue ? 'card-has-due' : 'card-cleared'}`}
                  >
                    {/* Header: Avatar, Name, Role badge */}
                    <div className="player-card-header">
                      <Avatar
                        name={pl.name}
                        label={pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== '' ? `#${pl.jerseyNumber}` : undefined}
                        size="md"
                      />

                      <div className="player-card-titles">
                        <Link href={`/players/${pl._id}`} className="player-card-name-link">
                          <span>{pl.name}</span>
                          <ExternalLink size={10} color="var(--accent-blue)" />
                        </Link>
                        <div className="player-card-sub">
                          <Badge variant="purple" style={{ fontSize: '9.5px', textTransform: 'capitalize', padding: '1px 5px' }}>
                            {pl.role?.replace('_', ' ') || 'Player'}
                          </Badge>
                          {pl.phone && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                              {pl.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats strip: Matches, Tourneys, Assigned, Paid, Returned, Due */}
                    <div className="player-card-stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Matches</span>
                        <span className="player-stat-val">{pl.matchesPlayed || 0}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Tourneys</span>
                        <span className="player-stat-val" style={{ color: 'var(--accent-purple)' }}>{pl.tournamentsCount || 0}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Assigned</span>
                        <span className="player-stat-val" style={{ fontSize: '11px' }}>Rs. {fNum(pl.totalFeeAssigned)}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Paid</span>
                        <span className="player-stat-val player-stat-paid" style={{ fontSize: '11px' }}>Rs. {fNum(pl.totalFeePaid)}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Returned</span>
                        <span className="player-stat-val" style={{ fontSize: '11px', color: (pl.totalReturned || 0) > 0 ? '#b45309' : 'var(--text-muted)' }}>
                          Rs. {fNum(pl.totalReturned || 0)}
                        </span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Due</span>
                        <span className={`player-stat-val ${hasDue ? 'player-stat-due' : ''}`} style={{ fontSize: '11px' }}>
                          {hasDue ? `Rs. ${fNum(due)}` : 'Rs. 0'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Due status badge + Quick actions */}
                    <div className="player-card-footer">
                      <div>
                        {hasDue ? (
                          <Badge variant="danger" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Rs. {fNum(due)} Due
                          </Badge>
                        ) : (
                          <Badge variant="success" icon={<CheckCircle2 size={10} />} style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Cleared
                          </Badge>
                        )}
                      </div>

                      <div className="action-group" style={{ gap: '4px' }}>
                        <Button
                          variant="success"
                          size="sm"
                          icon={<DollarIcon size={12} />}
                          onClick={() => openFeeModal(pl)}
                          title="Collect / Pay Match Fee"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Pay
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<DollarIcon size={12} />}
                          onClick={() => {
                            setSelectedPlayerForReturn(pl);
                            setIsReturnOpen(true);
                          }}
                          title="Return excess fee or payout"
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#fef3c7', borderColor: '#fde68a', color: '#b45309', fontWeight: 700 }}
                        >
                          Return
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          icon={<Pencil size={12} color="var(--accent-blue)" />}
                          onClick={() => handleEditOpen(pl)}
                          title="Edit"
                          style={{ padding: '4px 6px' }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          isIconOnly
                          icon={<Trash2 size={12} />}
                          onClick={() => handleDelete(pl._id, pl.name)}
                          title="Deactivate"
                          style={{ padding: '4px 6px' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedPlayers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            itemName="Players"
          />
        </div>
      )}

        {/* Modal: Add Player */}
        <RegisterPlayerModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Player */}
        <EditPlayerModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingPlayer(null);
          }}
          player={editingPlayer}
          onSuccess={invalidateData}
        />

        {/* Modal: Collect Match Fee */}
        <CollectMatchFeeModal
          isOpen={isFeeModalOpen}
          onClose={() => {
            setIsFeeModalOpen(false);
            setSelectedPlayerForFee(null);
          }}
          player={selectedPlayerForFee}
          onSuccess={invalidateData}
        />

        {/* Player Return Modal */}
        <PlayerReturnModal
          isOpen={isReturnOpen}
          onClose={() => {
            setIsReturnOpen(false);
            setSelectedPlayerForReturn(null);
          }}
          player={selectedPlayerForReturn}
          onSuccess={invalidateData}
        />
      </div>
    </>
  );
}
