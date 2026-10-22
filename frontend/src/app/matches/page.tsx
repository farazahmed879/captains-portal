'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import {
  Button,
  Badge,
  Input,
  Select,
  Textarea,
  DatePicker,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
  Modal,
  Pagination,
  ViewSwitcher,
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

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [selectedTournamentFilter, setSelectedTournamentFilter] = useState<string>('');
  const [resultFilter, setResultFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isPaymentsOpen, setIsPaymentsOpen] = useState<boolean>(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [matchPayments, setMatchPayments] = useState<any[]>([]);
  const [showAddPlayerPayment, setShowAddPlayerPayment] = useState<boolean>(false);
  const [newPayment, setNewPayment] = useState({
    playerId: '',
    feeAssigned: 1000,
    feePaid: 1000,
    paymentMethod: 'cash',
  });

  // Create Form Data
  const [formData, setFormData] = useState({
    teamId: '',
    matchType: 'tournament',
    tournamentId: '',
    tournamentStage: 'group',
    matchDate: new Date().toISOString().split('T')[0],
    opponentTeam: '',
    venue: '',
    overs: 20,
    groundCost: '',
    umpireCost: '',
    ballCost: '',
    refreshmentCost: '',
    otherCosts: '',
    perPlayerFee: '',
    squadPlayerIds: [] as string[],
    result: 'upcoming',
    teamScore: '',
    opponentScore: '',
    winningPrizeMoney: '',
    momPlayerId: '',
    momAwardDetails: '',
    momPrizeMoney: '',
    notes: '',
  });

  // Edit Form Data
  const [editFormData, setEditFormData] = useState({
    id: '',
    opponentTeam: '',
    venue: '',
    matchDate: '',
    overs: 20,
    tournamentStage: 'group',
    groundCost: 0,
    umpireCost: 0,
    ballCost: 0,
    refreshmentCost: 0,
    otherCosts: 0,
    result: 'upcoming',
    winningPrizeMoney: 0,
    notes: '',
  });

  const loadData = () => {
    setLoading(true);
    let query = `?teamId=${selectedTeamId}`;
    if (selectedTournamentFilter) query += `&tournamentId=${selectedTournamentFilter}`;

    Promise.all([
      fetchApi<{ success: boolean; matches: any[] }>(`/matches${query}`),
      fetchApi<{ success: boolean; teams: any[] }>('/teams'),
      fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
      fetchApi<{ success: boolean; players: any[] }>('/players'),
    ])
      .then(([mRes, tRes, trnRes, pRes]) => {
        if (mRes.success) setMatches(mRes.matches);
        if (tRes.success) {
          setTeams(tRes.teams);
          if (tRes.teams.length > 0 && !formData.teamId) {
            setFormData((prev) => ({ ...prev, teamId: tRes.teams[0]._id }));
          }
        }
        if (trnRes.success) setTournaments(trnRes.tournaments);
        if (pRes.success) setPlayers(pRes.players);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [selectedTeamId, selectedTournamentFilter]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; match: any }>('/matches', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setIsCreateOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to schedule match');
    }
  };

  const handleEditOpen = (match: any) => {
    setEditFormData({
      id: match._id,
      opponentTeam: match.opponentTeam,
      venue: match.venue,
      matchDate: match.matchDate ? new Date(match.matchDate).toISOString().split('T')[0] : '',
      overs: match.overs || 20,
      tournamentStage: match.tournamentStage || 'group',
      groundCost: match.groundCost || 0,
      umpireCost: match.umpireCost || 0,
      ballCost: match.ballCost || 0,
      refreshmentCost: match.refreshmentCost || 0,
      otherCosts: match.otherCosts || 0,
      result: match.result || 'upcoming',
      winningPrizeMoney: match.winningPrizeMoney || 0,
      notes: match.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update match');
    }
  };

  const handleDeleteMatch = async (id: string, matchTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete match "${matchTitle}"? Associated squad payment records will also be removed.`
      )
    ) {
      return;
    }
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Failed to delete match');
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
      .catch((err) => alert('Failed to load match payments'));
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
        loadData();
      }
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleAddPlayerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch || !newPayment.playerId) return;
    try {
      const res = await fetchApi<{ success: boolean; payment: any }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          matchId: selectedMatch._id,
          playerId: newPayment.playerId,
          feeAssigned: Number(newPayment.feeAssigned) || 0,
          feePaid: Number(newPayment.feePaid) || 0,
          paymentMethod: newPayment.paymentMethod,
        }),
      });
      if (res.success) {
        setMatchPayments((prev) => {
          const idx = prev.findIndex((p) => (p.playerId?._id || p.playerId) === newPayment.playerId);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = res.payment;
            return copy;
          }
          return [...prev, res.payment];
        });
        setNewPayment({
          playerId: '',
          feeAssigned: 1000,
          feePaid: 1000,
          paymentMethod: 'cash',
        });
        setShowAddPlayerPayment(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to add player fee');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Remove this player payment record?')) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setMatchPayments((prev) => prev.filter((p) => p._id !== paymentId));
        loadData();
      }
    } catch (err) {
      alert('Failed to remove player payment');
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

  const getResultBadgeVariant = (result: string) => {
    switch (result?.toLowerCase()) {
      case 'won':
        return 'success' as const;
      case 'lost':
        return 'danger' as const;
      default:
        return 'warning' as const;
    }
  };

  return (
    <>
      <Header
        title="Matches, Ground Costs & Collections"
        subtitle="Complete Match Records Across All Tournaments with Editable & Delete Options"
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
      />

      <div className="content-body">
        {/* Filter Bar: Search, Tournament Filter, Result Filter, View Switcher, Add Match */}
        <div className="filter-bar">
          <div className="filter-bar-left">
            <div style={{ width: '240px' }}>
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

            <div style={{ width: '210px' }}>
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

            <div style={{ width: '140px' }}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament & Stage</TableHead>
                  <TableHead>Date & Venue</TableHead>
                  <TableHead>Match Costs</TableHead>
                  <TableHead>Squad Dues Status</TableHead>
                  <TableHead>Result / MOM</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedMatches.length === 0 ? (
                  <TableEmpty colSpan={6} message="No matches found matching your filters." />
                ) : (
                  paginatedMatches.map((m) => (
                    <TableRow key={m._id} onClick={() => router.push(`/matches/${m._id}`)}>
                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.tournamentId?.name ||
                            (m.matchType === 'tournament' ? 'Tournament Match' : 'Friendly')}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
                          <Badge variant="purple" style={{ fontSize: '10px' }}>
                            {m.tournamentStage || 'Match'}
                          </Badge>
                          <Badge variant="primary" style={{ fontSize: '10px' }}>
                            {m.overs} Overs
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/matches/${m._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--accent-blue)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <span>{m.venue}</span>
                          <ExternalLink size={11} />
                        </Link>
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            marginTop: '2px',
                          }}
                        >
                          <Calendar size={12} />
                          <span>{new Date(m.matchDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{m.opponentTeam}</span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
                          Rs. {fNum(m.totalMatchExpense)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Ground: Rs. {fNum(m.groundCost)} | Ref: Rs. {fNum(m.refreshmentCost)}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                          Rs. {fNum(m.totalCollected)}{' '}
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontWeight: 400,
                            }}
                          >
                            / Rs. {fNum(m.totalAssigned)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color:
                              m.pendingFee > 0 ? 'var(--accent-rose)' : 'var(--accent-green)',
                          }}
                        >
                          {m.pendingFee > 0 ? `Rs. ${fNum(m.pendingFee)} Due` : '100% Cleared'}{' '}
                          ({m.paidPlayersCount}/{m.squadPlayerIds?.length || 0} players)
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant={getResultBadgeVariant(m.result)}>
                          {m.result?.toUpperCase()}
                        </Badge>
                        {m.winningPrizeMoney > 0 && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--accent-green)',
                              fontWeight: 600,
                              marginTop: '2px',
                            }}
                          >
                            +Rs. {fNum(m.winningPrizeMoney)}
                          </div>
                        )}
                      </TableCell>

                      <TableCell align="right">
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Users size={14} />}
                            onClick={() => openPaymentsModal(m._id)}
                            title="Track Squad Payments"
                          >
                            Fees
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            icon={<Pencil size={14} color="var(--accent-blue)" />}
                            onClick={() => handleEditOpen(m)}
                            title="Edit Match"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            icon={<Trash2 size={14} />}
                            onClick={() =>
                              handleDeleteMatch(
                                m._id,
                                `${m.tournamentId?.name || ''} - ${m.venue}`
                              )
                            }
                            title="Delete Match"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMatches.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        ) : (
          /* Cards View */
          <div>
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMatches.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Modal: Schedule / Add Match */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Schedule New Match"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateMatch}>
                Save Match
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreateMatch}>
            <div className="grid-2">
              <Select
                label="Team *"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
                options={teams.map((t) => ({ value: t._id, label: t.name }))}
              />

              <Select
                label="Tournament / League"
                value={formData.tournamentId}
                onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                required
                options={[
                  { value: '', label: 'Select Tournament...' },
                  ...tournaments.map((trn) => ({
                    value: trn._id,
                    label: `${trn.name} (${trn.format})`,
                  })),
                ]}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Venue / Ground *"
                placeholder="e.g. Baqai Ground, Landhi"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                required
              />

              <Input
                label="Opponent Team *"
                placeholder="e.g. Malir Gymkhana"
                value={formData.opponentTeam}
                onChange={(e) => setFormData({ ...formData, opponentTeam: e.target.value })}
                required
              />
            </div>

            <div className="grid-3">
              <DatePicker
                label="Match Date *"
                value={formData.matchDate}
                onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                required
              />

              <Select
                label="Stage"
                value={formData.tournamentStage}
                onChange={(e) => setFormData({ ...formData, tournamentStage: e.target.value })}
                options={[
                  { value: 'group', label: 'Group / League Match' },
                  { value: 'quarter_final', label: 'Quarter Final' },
                  { value: 'semi_final', label: 'Semi Final' },
                  { value: 'final', label: 'Final' },
                ]}
              />

              <Input
                label="Overs"
                type="number"
                value={formData.overs}
                onChange={(e) => setFormData({ ...formData, overs: Number(e.target.value) })}
              />
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '10px',
                  color: 'var(--accent-blue)',
                }}
              >
                Match Day Costs (Rs.)
              </div>
              <div className="grid-3" style={{ marginBottom: 0 }}>
                <Input
                  label="Ground Booking"
                  type="number"
                  placeholder="10000"
                  value={formData.groundCost}
                  onChange={(e) => setFormData({ ...formData, groundCost: e.target.value })}
                />
                <Input
                  label="Refreshments"
                  type="number"
                  placeholder="500"
                  value={formData.refreshmentCost}
                  onChange={(e) => setFormData({ ...formData, refreshmentCost: e.target.value })}
                />
                <Input
                  label="Ball & Umpire"
                  type="number"
                  placeholder="2000"
                  value={formData.ballCost}
                  onChange={(e) => setFormData({ ...formData, ballCost: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Match */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Match Record"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdateMatch}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdateMatch}>
            <div className="grid-2">
              <Input
                label="Venue / Ground *"
                value={editFormData.venue}
                onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
                required
              />

              <Input
                label="Opponent Team"
                value={editFormData.opponentTeam}
                onChange={(e) => setEditFormData({ ...editFormData, opponentTeam: e.target.value })}
                required
              />
            </div>

            <div className="grid-3">
              <DatePicker
                label="Match Date"
                value={editFormData.matchDate}
                onChange={(e) => setEditFormData({ ...editFormData, matchDate: e.target.value })}
              />

              <Select
                label="Stage"
                value={editFormData.tournamentStage}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, tournamentStage: e.target.value })
                }
                options={[
                  { value: 'group', label: 'Group / League Match' },
                  { value: 'quarter_final', label: 'Quarter Final' },
                  { value: 'semi_final', label: 'Semi Final' },
                  { value: 'final', label: 'Final' },
                ]}
              />

              <Select
                label="Result"
                value={editFormData.result}
                onChange={(e) => setEditFormData({ ...editFormData, result: e.target.value })}
                options={[
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'draw', label: 'Draw / Tied' },
                  { value: 'upcoming', label: 'Upcoming' },
                ]}
              />
            </div>

            <div className="grid-3">
              <Input
                label="Ground Booking Cost (Rs.)"
                type="number"
                value={editFormData.groundCost}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, groundCost: Number(e.target.value) })
                }
              />

              <Input
                label="Refreshments (Rs.)"
                type="number"
                value={editFormData.refreshmentCost}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, refreshmentCost: Number(e.target.value) })
                }
              />

              <Input
                label="Prize Money Won (Rs.)"
                type="number"
                value={editFormData.winningPrizeMoney}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, winningPrizeMoney: Number(e.target.value) })
                }
              />
            </div>

            <Textarea
              label="Match Remarks / Notes"
              rows={2}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </form>
        </Modal>

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
                {showAddPlayerPayment && (
                  <form
                    onSubmit={handleAddPlayerPayment}
                    style={{
                      padding: '14px',
                      background: '#f0f9ff',
                      border: '1px solid #bae6fd',
                      borderRadius: '8px',
                      marginBottom: '16px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13px',
                        color: 'var(--accent-blue)',
                        marginBottom: '10px',
                      }}
                    >
                      Add Player to Squad &amp; Assign Fee
                    </div>
                    <div className="grid-3" style={{ marginBottom: '10px' }}>
                      <Select
                        label="Select Player *"
                        value={newPayment.playerId}
                        onChange={(e) =>
                          setNewPayment({ ...newPayment, playerId: e.target.value })
                        }
                        required
                        options={[
                          { value: '', label: '— Choose Player —' },
                          ...players.map((p) => ({
                            value: p._id,
                            label: `${p.name} ${p.jerseyNumber ? `(#${p.jerseyNumber})` : ''}`,
                          })),
                        ]}
                      />
                      <Input
                        label="Fee Assigned (Rs.) *"
                        type="number"
                        value={newPayment.feeAssigned}
                        onChange={(e) =>
                          setNewPayment({
                            ...newPayment,
                            feeAssigned: Number(e.target.value),
                          })
                        }
                        required
                      />
                      <Input
                        label="Fee Paid (Rs.) *"
                        type="number"
                        value={newPayment.feePaid}
                        onChange={(e) =>
                          setNewPayment({
                            ...newPayment,
                            feePaid: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddPlayerPayment(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        type="submit"
                        icon={<CheckCircle2 size={12} />}
                      >
                        Save Player Fee
                      </Button>
                    </div>
                  </form>
                )}

                {/* Squad Payments Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Assigned</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead align="right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matchPayments.length === 0 ? (
                      <TableEmpty
                        colSpan={5}
                        message="No squad payments recorded for this match yet. Click '+ Add Player Fee' above to record players."
                      />
                    ) : (
                      matchPayments.map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>
                            <div style={{ fontWeight: 600 }}>{p.playerId?.name || 'Player'}</div>
                            {p.playerId?.jerseyNumber && (
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                #{p.playerId.jerseyNumber}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>Rs. {fNum(p.feeAssigned)}</TableCell>
                          <TableCell style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                            Rs. {fNum(p.feePaid)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                p.paymentStatus === 'paid'
                                  ? 'success'
                                  : p.paymentStatus === 'partial'
                                  ? 'warning'
                                  : 'danger'
                              }
                            >
                              {p.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell align="right">
                            <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                              {p.paymentStatus !== 'paid' && (
                                <Button
                                  variant="success"
                                  size="sm"
                                  icon={<CheckCircle2 size={14} />}
                                  onClick={() => handleQuickPay(p._id, p.feeAssigned)}
                                  title="Mark as Paid"
                                >
                                  Mark Paid
                                </Button>
                              )}
                              <Button
                                variant="danger"
                                size="sm"
                                isIconOnly
                                icon={<Trash2 size={14} />}
                                onClick={() => handleDeletePayment(p._id)}
                                title="Remove player from match"
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </Modal>
      </div>
    </>
  );
}
