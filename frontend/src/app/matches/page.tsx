'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Match, MatchPayment } from '../../types';
import { getMatchColumns } from '../../columns';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import { confirmDelete, confirmBulkDelete, showToast } from '../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  DatePicker,
  Card,
  DataTable,
  Modal,
  Pagination,
  ViewSwitcher,
  CardGridSkeleton,
  BulkActionBar,
  GridSelectCheckbox,
} from '../../components/ui';
import {
  Swords,
  Plus,
  Calendar,
  MapPin,
  CheckCircle2,
  Trophy,
  DollarSign,
  Users,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  Eye,
} from '../../components/icons';
import { CreateMatchModal } from '../../components/CreateMatchModal';
import { EditMatchModal } from '../../components/EditMatchModal';
import { SquadFeesModal } from '../../components/SquadFeesModal';

export default function MatchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await confirmBulkDelete(
      selectedIds.length,
      'Matches',
      `You are about to permanently delete ${selectedIds.length} selected match(es) and their squad payment records.`
    );
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map((id) => fetchApi(`/matches/${id}`, { method: 'DELETE' })));
      showToast.success(`${selectedIds.length} match(es) deleted successfully.`);
      setSelectedIds([]);
      invalidateData();
    } catch (err) {
      showToast.error('Failed to delete selected matches.');
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const pageSize = 15;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingMatch, setEditingMatch] = useState<any>(null);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchPayments, setMatchPayments] = useState<any[]>([]);
  const [showAddPlayerPayment, setShowAddPlayerPayment] = useState<boolean>(false);

  // React Queries
  const matchesQuery = useQuery({
    queryKey: queryKeys.matches({ teamId: selectedTeamId, tournamentId: selectedTournamentFilter }),
    queryFn: () => {
      let query = `?teamId=${selectedTeamId}`;
      if (selectedTournamentFilter) query += `&tournamentId=${selectedTournamentFilter}`;
      return fetchApi<{ success: boolean; matches: any[] }>(`/matches${query}`);
    },
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const tournamentsQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () => fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
  });

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
  });

  const matches = matchesQuery.data?.matches || [];
  const teams = teamsQuery.data?.teams || [];
  const tournaments = tournamentsQuery.data?.tournaments || [];
  const players = playersQuery.data?.players || [];
  const loading =
    matchesQuery.isLoading ||
    teamsQuery.isLoading ||
    tournamentsQuery.isLoading ||
    playersQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
  };

  const handleEditOpen = (match: any) => {
    setEditingMatch(match);
    setIsEditOpen(true);
  };

  const handleDeleteMatch = async (id: string, matchTitle: string) => {
    const confirmed = await confirmDelete(
      `match "${matchTitle}"`,
      'Associated squad payment records will also be permanently removed.'
    );
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Match "${matchTitle}" deleted successfully.`);
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to delete match.');
    }
  };

  const openPaymentsModal = (matchId: string) => {
    fetchApi<{ success: boolean; match: any; payments: any[] }>(`/matches/${matchId}`)
      .then((res) => {
        if (res.success) {
          setSelectedMatch(res.match);
          setMatchPayments(res.payments);
          setIsPaymentsOpen(true);
        }
      })
      .catch(() => showToast.error('Failed to load match payments.'));
  };

  const handleQuickPay = async (paymentId: string, fullFee: number) => {
    try {
      const res = await fetchApi<{ success: boolean; payment: any }>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: fullFee,
          paymentStatus: 'paid',
          paymentDate: new Date(),
          paymentMethod: 'cash',
        }),
      });
      if (res.success) {
        setMatchPayments((prev) => (prev.map((p) => (p._id === paymentId ? res.payment : p))));
        showToast.success('Player match fee marked as paid!');
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to update payment.');
    }
  };

  const refreshMatchPayments = (matchId: string) => {
    fetchApi<{ success: boolean; match: any; payments: any[] }>(`/matches/${matchId}`).then((res) => {
      if (res.success) {
        setSelectedMatch(res.match);
        setMatchPayments(res.payments);
      }
    });
    invalidateData();
  };

  const handleMarkAllPaid = async (matchId: string) => {
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>(
        `/payments/matches/${matchId}/mark-all-paid`,
        { method: 'PUT' }
      );
      if (res.success) {
        showToast.success('All squad match fees marked as paid!');
        invalidateData();
        refreshMatchPayments(matchId);
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to update payments.');
    }
  };

  const handleDeletePayment = async (paymentId: string, playerName?: string) => {
    const confirmed = await confirmDelete(playerName ? `squad payment for "${playerName}"` : 'player payment record', 'Remove this player from the match squad?');
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setMatchPayments((prev) => prev.filter((p) => p._id !== paymentId));
        showToast.success('Player payment record removed.');
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to remove player payment.');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const filteredMatches = matches.filter((m) => {
    const q = searchQuery.toLowerCase();
    const venueMatch = (m.venue || '').toLowerCase().includes(q);
    const oppMatch = (m.opponentTeam || '').toLowerCase().includes(q);
    const tourMatch = (m.tournamentId?.name || '').toLowerCase().includes(q);
    const resMatch = !resultFilter || (m.result || '').toLowerCase() === resultFilter.toLowerCase();
    return (venueMatch || oppMatch || tourMatch) && resMatch;
  });

  const totalPages = Math.ceil(filteredMatches.length / pageSize) || 1;
  const paginatedMatches = filteredMatches.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getResultBadgeVariant = (result?: string) => {
    switch (result?.toLowerCase()) {
      case 'won':
        return 'success' as const;
      case 'lost':
        return 'danger' as const;
      default:
        return 'warning' as const;
    }
  };

  const matchColumns = useMemo(
    () =>
      getMatchColumns({
        onPayments: openPaymentsModal,
        onEdit: handleEditOpen,
        onDelete: handleDeleteMatch,
        getResultBadgeVariant,
        fNum,
      }),
    [fNum]
  );

  return (
    <>
      <Header
        title="Matches, Ground Costs & Collections"
        subtitle="Complete Match Records Across All Tournaments with Editable & Delete Options"
        selectedTeamId={selectedTeamId}
        onTeamChange={(id) => {
          setSelectedTeamId(id);
          setCurrentPage(1);
        }}
      />

      <div className="content-body">
        {/* Filter Bar: Search, Tournament Filter, Result Filter, View Switcher, Add Match */}
        <div className="filter-bar">
          <div className="filter-bar-left">
            <div className="filter-field filter-field-search" style={{ width: '240px' }}>
              <Input
                placeholder="Search venue or opponent..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                icon={<Search size={14} />}
              />
            </div>

            <div className="filter-field" style={{ width: '210px' }}>
              <Select
                value={selectedTournamentFilter}
                onChange={(e) => {
                  setSelectedTournamentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: `All Tournaments (${matches.length})` },
                  ...tournaments.map((trn) => ({ value: trn._id, label: trn.name })),
                ]}
              />
            </div>

            <div className="filter-field" style={{ width: '140px' }}>
              <Select
                value={resultFilter}
                onChange={(e) => {
                  setResultFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={[
                  { value: '', label: 'All Results' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'upcoming', label: 'Upcoming' },
                ]}
              />
            </div>
          </div>

          <div className="filter-bar-right">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Match
            </Button>
          </div>
        </div>

        <BulkActionBar
          selectedIds={selectedIds}
          pageItemIds={paginatedMatches.map((m: any) => m._id)}
          allItemIds={filteredMatches.map((m: any) => m._id)}
          itemLabel="Matches"
          onSelectChange={setSelectedIds}
          onBulkDelete={handleBulkDelete}
          deleting={isBulkDeleting}
        />

        {/* Matches Display: Table View */}
        {viewMode === 'table' ? (
          <div>
            <DataTable<Match>
              data={paginatedMatches}
              keyExtractor={(m) => m._id}
              onRowClick={(m) => router.push(`/matches/${m._id}`)}
              selectable
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              emptyMessage="No matches found matching your filters."
              columns={matchColumns}
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMatches.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="Matches"
            />
          </div>
        ) : (
          /* Cards View */
          <div>
            {loading ? (
              <CardGridSkeleton count={4} />
            ) : (
              <div className="grid-2">
                {paginatedMatches.map((m) => (
                <Card
                  key={m._id}
                  variant={m.result?.toLowerCase() === 'won' ? 'emerald' : m.result?.toLowerCase() === 'lost' ? 'rose' : 'blue'}
                  style={{ position: 'relative' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Badge variant="purple">{m.tournamentId?.name || 'Tournament'}</Badge>
                        <Badge variant="primary">{m.tournamentStage}</Badge>
                        <Badge variant={getResultBadgeVariant(m.result)}>
                          {m.result?.toUpperCase()}
                        </Badge>
                      </div>
                      <Link
                        href={`/matches/${m._id}`}
                        style={{
                          fontSize: '18px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{m.venue}</span>
                        <ExternalLink size={12} color="var(--accent-blue)" />
                      </Link>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '2px',
                        }}
                      >
                        {(m.teamId?.name || 'Our Team')} vs {m.opponentTeam} • {new Date(m.matchDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="action-group">
                      <GridSelectCheckbox
                        checked={selectedIds.includes(m._id)}
                        onChange={() => toggleSelectOne(m._id)}
                        title={`Select match at ${m.venue}`}
                      />
                      <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          icon={<Eye size={13} color="var(--accent-blue)" />}
                          title="View Match Details"
                        />
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        icon={<Pencil size={13} color="var(--accent-blue)" />}
                        onClick={() => handleEditOpen(m)}
                        title="Edit Match"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        isIconOnly
                        icon={<Trash2 size={13} />}
                        onClick={() =>
                          handleDeleteMatch(
                            m._id,
                            `${m.tournamentId?.name || ''} - ${m.venue}`
                          )
                        }
                        title="Delete Match"
                      />
                    </div>
                  </div>

                  {/* Financials in Card */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '8px',
                      padding: '10px 14px',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Match Costs
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(m.totalMatchExpense)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Squad Collections
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                        Rs. {fNum(m.totalCollected)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        color:
                          m.pendingFee > 0 ? 'var(--accent-rose)' : 'var(--accent-green)',
                      }}
                    >
                      {m.pendingFee > 0 ? `Rs. ${fNum(m.pendingFee)} Due` : 'Squad Cleared'}
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Users size={13} />}
                      onClick={() => openPaymentsModal(m._id)}
                    >
                      Track Squad Fees ({m.paidPlayersCount}/{m.squadPlayerIds?.length || 0})
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMatches.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              itemName="Matches"
            />
          </div>
        )}

        {/* Modal: Schedule / Add Match */}
        <CreateMatchModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          teams={teams}
          tournaments={tournaments}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Match */}
        <EditMatchModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setEditingMatch(null);
          }}
          match={editingMatch}
          tournaments={tournaments}
          onSuccess={invalidateData}
        />

        {/* Unified 2-Column Squad Fees Ledger Modal */}
        <SquadFeesModal
          isOpen={isPaymentsOpen}
          onClose={() => setIsPaymentsOpen(false)}
          match={selectedMatch}
          initialPayments={matchPayments}
          players={players}
          onSuccess={() => {
            if (selectedMatch) refreshMatchPayments(selectedMatch._id);
            invalidateData();
          }}
        />
      </div>
    </>
  );
}
