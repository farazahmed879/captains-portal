'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { Match, MatchPayment } from '../../types';
import { getMatchColumns, getMatchSquadPaymentColumns } from '../../columns';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import { confirmDelete, showToast } from '../../lib/alerts';
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
import { AssignSquadFeeForm } from '../../components/AssignSquadFeeForm';

export default function MatchesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
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

  const handleDeletePayment = async (paymentId: string) => {
    const confirmed = await confirmDelete('player payment record', 'Remove this player from the match squad?');
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

  const squadPaymentColumns = useMemo(
    () =>
      getMatchSquadPaymentColumns({
        onQuickPay: handleQuickPay,
        onDelete: handleDeletePayment,
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

        {/* Matches Display: Table View */}
        {viewMode === 'table' ? (
          <div>
            <DataTable<Match>
              data={paginatedMatches}
              keyExtractor={(m) => m._id}
              onRowClick={(m) => router.push(`/matches/${m._id}`)}
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
                        vs {m.opponentTeam} • {new Date(m.matchDate).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="action-group">
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
          onSuccess={invalidateData}
        />

        {/* Modal: Match Squad Fees Collection Drawer */}
        <Modal
          isOpen={isPaymentsOpen}
          onClose={() => {
            setIsPaymentsOpen(false);
            setShowAddPlayerPayment(false);
          }}
          title={selectedMatch ? `Squad Fees - ${selectedMatch.opponentTeam || selectedMatch.venue || 'Match'}` : 'Squad Fees'}
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                setIsPaymentsOpen(false);
                setShowAddPlayerPayment(false);
              }}
            >
              Close
            </Button>
          }
        >
          {selectedMatch && (() => {
            const totalCost = selectedMatch.totalMatchExpense || 0;
            const totalCollected = matchPayments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
            const totalAssigned = matchPayments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
            const remaining = totalCost > totalCollected ? totalCost - totalCollected : 0;

            return (
              <div>
                {/* Match Summary Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '16px',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Total Match Cost
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                      Rs. {fNum(totalCost)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Total Assigned
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      Rs. {fNum(totalAssigned)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Total Collected
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)' }}>
                      Rs. {fNum(totalCollected)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Remaining Pending
                    </div>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: remaining > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
                      }}
                    >
                      Rs. {fNum(remaining)}
                    </div>
                  </div>
                </div>

                {/* Match Details & Add Player Action Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>
                      Venue: <strong>{selectedMatch.venue || 'N/A'}</strong>
                    </span>
                    {selectedMatch.tournamentStage && (
                      <span style={{ marginLeft: '10px' }}>
                        Stage:{' '}
                        <strong style={{ textTransform: 'capitalize' }}>
                          {selectedMatch.tournamentStage.replace(/_/g, ' ')}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="action-group">
                    <Button
                      variant={showAddPlayerPayment ? 'secondary' : 'primary'}
                      size="sm"
                      icon={<Plus size={12} />}
                      onClick={() => setShowAddPlayerPayment(!showAddPlayerPayment)}
                    >
                      {showAddPlayerPayment ? 'Cancel' : '+ Add Player Fee'}
                    </Button>
                    <Link href={`/matches/${selectedMatch._id}`} passHref legacyBehavior>
                      <Button variant="secondary" size="sm" icon={<ExternalLink size={12} />}>
                        Full Details
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Inline Add Player Fee Form */}
                {showAddPlayerPayment && selectedMatch && (
                  <AssignSquadFeeForm
                    matchId={selectedMatch._id}
                    defaultFee={selectedMatch.perPlayerFee || 1000}
                    players={players}
                    onSuccess={() => {
                      setShowAddPlayerPayment(false);
                      refreshMatchPayments(selectedMatch._id);
                    }}
                    onCancel={() => setShowAddPlayerPayment(false)}
                  />
                )}

                {/* Squad Payments Table */}
                <DataTable<MatchPayment>
                  data={matchPayments}
                  keyExtractor={(p) => p._id}
                  emptyMessage="No squad payments recorded for this match yet. Click '+ Add Player Fee' above to record players."
                  columns={squadPaymentColumns}
                />
              </div>
            );
          })()}
        </Modal>
      </div>
    </>
  );
}
