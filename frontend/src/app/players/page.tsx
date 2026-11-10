'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import { confirmDelete, confirmBulkDelete, showToast } from '../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Modal,
  DataTable,
  Pagination,
  ViewSwitcher,
  Avatar,
  CardGridSkeleton,
  BulkActionBar,
  GridSelectCheckbox,
  ListToolbar,
} from '../../components/ui';
import { PLAYER_ROLE_OPTIONS, PLAYER_SORT_OPTIONS, withAllOption } from '../../constants';
import { Player } from '../../types';
import { getPlayerColumns } from '../../columns';
import {
  Search,
  Pencil,
  Trash2,
} from '../../components/icons';
import { PlayerReturnModal } from '../../components/PlayerReturnModal';
import { RegisterPlayerModal } from '../../components/RegisterPlayerModal';
import { EditPlayerModal } from '../../components/EditPlayerModal';
import { CollectMatchFeeModal } from '../../components/CollectMatchFeeModal';
import { useIsMobile } from '../../lib/useMediaQuery';
import { formatNumber } from '../../lib/format';
import { usePageSize } from '../../lib/usePageSize';

export default function PlayersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
    // The whole roster is loaded once; search and role filtering happen below, on the page.
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
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

  const [preferredView, setViewMode] = useState<'table' | 'grid'>('table');
  // Phones always show the list; the List/Grid switch is hidden there (globals.css).
  const isMobile = useIsMobile();
  const viewMode = isMobile ? 'table' : preferredView;
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'cleared'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'due' | 'matches'>('name');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmBulkDelete(selectedIds.length, 'Players');
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => fetchApi(`/players/${id}`, { method: 'DELETE' })));
      showToast.success(`${selectedIds.length} player(s) deleted successfully.`);
      setSelectedIds([]);
      invalidateData();
    } catch (err) {
      showToast.error('Failed to delete selected players.');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const [pageSize, setPageSize] = usePageSize('players');

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
    const term = search.trim().toLowerCase();
    return players
      .filter((pl) => {
        const due = pl.pendingDue || 0;
        if (statusFilter === 'pending' && due <= 0) return false;
        if (statusFilter === 'cleared' && due > 0) return false;
        if (roleFilter && pl.role !== roleFilter) return false;
        if (
          term &&
          ![pl.name, pl.phone, pl.jerseyNumber != null ? `#${pl.jerseyNumber}` : '']
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term))
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'due') return (b.pendingDue || 0) - (a.pendingDue || 0);
        if (sortBy === 'matches') return (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [players, statusFilter, roleFilter, search, sortBy]);

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
      }),
    [openFeeModal, handleEditOpen, handleDelete]
  );

  return (
    <>
      <Header
        title="Player Rosters & Payment Ledgers"
        subtitle="Manage Player Profiles, Fees Assigned vs Paid, and Edit/Delete Player Details"
      />

      <div className="content-body">
        {/* Concise Filter Bar with Status Tabs & Controls */}
        <ListToolbar
          tabs={{
            value: statusFilter,
            onChange: (value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            },
            tabs: [
              { value: 'all', label: 'All Players', count: players.length },
              { value: 'pending', label: 'Pending Due', count: pendingCount, tone: 'pending' },
              { value: 'cleared', label: 'Cleared', count: clearedCount, tone: 'cleared' },
            ],
          }}
          search={{
            placeholder: 'Search player name...',
            value: search,
            onChange: (value) => {
              setSearch(value);
              setCurrentPage(1);
            },
          }}
          filters={[
            {
              value: roleFilter,
              onChange: (value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              },
              options: withAllOption('All Roles', PLAYER_ROLE_OPTIONS),
            },
            {
              value: sortBy,
              onChange: (value) => {
                setSortBy(value as typeof sortBy);
                setCurrentPage(1);
              },
              options: PLAYER_SORT_OPTIONS,
            },
          ]}
          view={{ value: viewMode, onChange: setViewMode }}
          add={{ label: 'Add Player', onClick: () => setIsCreateOpen(true) }}
        />

        {/* Bulk Selection & Multi-Delete Bar */}
        <BulkActionBar
          selectedIds={selectedIds}
          pageItemIds={paginatedPlayers.map((pl: any) => pl._id)}
          allItemIds={displayedPlayers.map((pl: any) => pl._id)}
          itemLabel="Players"
          onSelectChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          deleting={isBulkDeleting}
        />

        {/* VIEW 1: HIGH-DENSITY TABLE VIEW */}
        {viewMode === 'table' && (
          <div>
            <DataTable
              data={paginatedPlayers}
              loading={loading}
              keyExtractor={(pl: any) => pl._id}
              emptyMessage="No players match the selected filters."
              onRowClick={(pl: any) => router.push(`/players/${pl._id}`)}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              columns={playerColumns}
              serialStartIndex={(currentPage - 1) * pageSize}
            />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedPlayers.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemName="Players"
          />
        </div>
      )}

      {/* VIEW 2: CONCISE COMPACT GRID (High visibility, minimal scrolling) */}
      {viewMode === 'grid' && (
        <div>
          {loading ? (
            <CardGridSkeleton count={6} />
          ) : (
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
                      <GridSelectCheckbox
                        checked={selectedIds.includes(pl._id)}
                        onChange={() => toggleSelectOne(pl._id)}
                        title={`Select ${pl.name}`}
                      />
                      <Avatar
                        name={pl.name}
                        label={pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== '' ? `#${pl.jerseyNumber}` : undefined}
                        size="md"
                      />

                      <div className="player-card-titles">
                        <Link href={`/players/${pl._id}`} className="player-card-name-link">
                          <span>{pl.name}</span>
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
                        <span className="player-stat-val" style={{ fontSize: '11px' }}>Rs. {formatNumber(pl.totalFeeAssigned)}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Paid</span>
                        <span className="player-stat-val player-stat-paid" style={{ fontSize: '11px' }}>Rs. {formatNumber(pl.totalFeePaid)}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Returned</span>
                        <span className="player-stat-val" style={{ fontSize: '11px', color: (pl.totalReturned || 0) > 0 ? '#334155' : 'var(--text-muted)' }}>
                          Rs. {formatNumber(pl.totalReturned || 0)}
                        </span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Due</span>
                        <span className={`player-stat-val ${hasDue ? 'player-stat-due' : ''}`} style={{ fontSize: '11px' }}>
                          {hasDue ? `Rs. ${formatNumber(due)}` : 'Rs. 0'}
                        </span>
                      </div>
                    </div>

                    {/* Footer: Due status badge + Quick actions */}
                    <div className="player-card-footer">
                      <div>
                        {hasDue ? (
                          <Badge variant="danger" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Rs. {formatNumber(due)} Due
                          </Badge>
                        ) : (
                          <Badge variant="success" style={{ fontSize: '10px', padding: '2px 6px' }}>
                            Cleared
                          </Badge>
                        )}
                      </div>

                      <div className="action-group" style={{ gap: '4px' }}>
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => openFeeModal(pl)}
                          title="Collect / Pay Match Fee"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Pay
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedPlayerForReturn(pl);
                            setIsReturnOpen(true);
                          }}
                          title="Return excess fee or payout"
                          style={{ padding: '4px 8px', fontSize: '11px', background: '#e2e8f0', borderColor: '#94a3b8', color: '#334155', fontWeight: 700 }}
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
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={displayedPlayers.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
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
