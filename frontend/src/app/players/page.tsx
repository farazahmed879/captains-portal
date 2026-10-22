'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
import {
  Button,
  Badge,
  Input,
  Select,
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
  ViewSwitcher,
} from '../../components/ui';
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
  DollarSign,
  AlertCircle,
  Calendar,
} from '../../components/icons';

export default function PlayersPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Match Fee Modal State
  const [isFeeModalOpen, setIsFeeModalOpen] = useState<boolean>(false);
  const [selectedPlayerForFee, setSelectedPlayerForFee] = useState<any>(null);
  const [feeModalLoading, setFeeModalLoading] = useState<boolean>(false);
  const [playerMatches, setPlayerMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [newMatchPayment, setNewMatchPayment] = useState({
    matchId: '',
    feeAssigned: 1000,
    feePaid: 1000,
    paymentMethod: 'cash',
  });

  // Create Form
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'all_rounder',
    battingStyle: 'right_hand',
    bowlingStyle: 'right_arm_medium',
    jerseyNumber: '',
    teamIds: [] as string[],
    notes: '',
  });

  // Edit Form
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    role: 'all_rounder',
    battingStyle: 'right_hand',
    bowlingStyle: 'right_arm_medium',
    jerseyNumber: '',
    notes: '',
  });

  const loadData = () => {
    setLoading(true);
    let query = `?search=${encodeURIComponent(search)}`;
    if (selectedTeamId) query += `&teamId=${selectedTeamId}`;
    if (roleFilter) query += `&role=${roleFilter}`;

    Promise.all([
      fetchApi<{ success: boolean; players: any[] }>(`/players${query}`),
      fetchApi<{ success: boolean; teams: any[] }>('/teams'),
    ])
      .then(([playersRes, teamsRes]) => {
        if (playersRes.success) setPlayers(playersRes.players);
        if (teamsRes.success) setTeams(teamsRes.teams);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamId, search, roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; player: any }>('/players', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          jerseyNumber: formData.jerseyNumber ? Number(formData.jerseyNumber) : undefined,
        }),
      });
      if (res.success) {
        setIsCreateOpen(false);
        setFormData({
          name: '',
          phone: '',
          email: '',
          role: 'all_rounder',
          battingStyle: 'right_hand',
          bowlingStyle: 'right_arm_medium',
          jerseyNumber: '',
          teamIds: [],
          notes: '',
        });
        loadData();
      }
    } catch (err) {
      alert('Failed to register player');
    }
  };

  const handleEditOpen = (pl: any) => {
    setEditFormData({
      id: pl._id,
      name: pl.name,
      phone: pl.phone || '',
      email: pl.email || '',
      role: pl.role || 'all_rounder',
      battingStyle: pl.battingStyle || 'right_hand',
      bowlingStyle: pl.bowlingStyle || 'right_arm_medium',
      jerseyNumber: pl.jerseyNumber ? String(pl.jerseyNumber) : '',
      notes: pl.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editFormData,
          jerseyNumber: editFormData.jerseyNumber ? Number(editFormData.jerseyNumber) : undefined,
        }),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update player');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate player "${name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Failed to delete player');
    }
  };

  const openFeeModal = async (player: any) => {
    setSelectedPlayerForFee(player);
    setIsFeeModalOpen(true);
    setFeeModalLoading(true);
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchApi<{ success: boolean; player: any; ledger: any }>(`/players/${player._id}`),
        fetchApi<{ success: boolean; matches: any[] }>('/matches'),
      ]);
      if (profileRes.success) {
        setPlayerMatches(profileRes.ledger?.matchHistory || []);
        setSelectedPlayerForFee((prev: any) => ({
          ...prev,
          ...profileRes.player,
          pendingDue: profileRes.ledger?.pendingDue ?? prev?.pendingDue,
          totalFeePaid: profileRes.ledger?.totalFeePaid ?? prev?.totalFeePaid,
        }));
      }
      if (matchesRes.success) {
        setAllMatches(matchesRes.matches || []);
        if (matchesRes.matches && matchesRes.matches.length > 0) {
          setNewMatchPayment((prev) => ({
            ...prev,
            matchId: prev.matchId || matchesRes.matches[0]._id,
            feeAssigned: matchesRes.matches[0].perPlayerFee || 1000,
            feePaid: matchesRes.matches[0].perPlayerFee || 1000,
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFeeModalLoading(false);
    }
  };

  const handleQuickPayMatch = async (paymentId: string, fullFee: number) => {
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
        if (selectedPlayerForFee) {
          openFeeModal(selectedPlayerForFee);
        }
        loadData();
      }
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleClearAllPendingDues = async () => {
    const pendingList = playerMatches.filter((p) => p.paymentStatus !== 'paid');
    if (pendingList.length === 0) return;
    if (!confirm(`Clear all pending match fees for ${selectedPlayerForFee?.name}?`)) return;
    try {
      const updates = pendingList.map((p) => ({
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
        if (selectedPlayerForFee) {
          openFeeModal(selectedPlayerForFee);
        }
        loadData();
      }
    } catch (err) {
      alert('Failed to clear pending dues');
    }
  };

  const handleCreateMatchFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerForFee || !newMatchPayment.matchId) return;
    try {
      const res = await fetchApi<{ success: boolean }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          matchId: newMatchPayment.matchId,
          playerId: selectedPlayerForFee._id,
          feeAssigned: Number(newMatchPayment.feeAssigned) || 0,
          feePaid: Number(newMatchPayment.feePaid) || 0,
          paymentMethod: newMatchPayment.paymentMethod,
        }),
      });
      if (res.success) {
        openFeeModal(selectedPlayerForFee);
        loadData();
      }
    } catch (err) {
      alert('Failed to assign/collect match fee');
    }
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
                  { value: 'batsman', label: 'Batsman' },
                  { value: 'bowler', label: 'Bowler' },
                  { value: 'all_rounder', label: 'All-Rounder' },
                  { value: 'wicket_keeper', label: 'Wicket-Keeper' },
                ]}
              />
            </div>

            {/* Sort Dropdown */}
            <select
              className="ledger-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="due">Sort: Due (High → Low)</option>
              <option value="matches">Sort: Matches Played</option>
            </select>
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
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player & Jersey</TableHead>
                <TableHead>Role & Details</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Fee Paid</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedPlayers.length === 0 ? (
                <TableEmpty colSpan={6} message="No players match the selected filters." />
              ) : (
                paginatedPlayers.map((pl) => (
                  <TableRow key={pl._id} onClick={() => router.push(`/players/${pl._id}`)}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#0369a1',
                            fontSize: '12px',
                          }}
                        >
                          {pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== ''
                            ? `#${pl.jerseyNumber}`
                            : pl.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <Link
                            href={`/players/${pl._id}`}
                            style={{
                              fontWeight: 700,
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>{pl.name}</span>
                            <ExternalLink size={10} color="var(--accent-blue)" />
                          </Link>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                            {pl.phone ? pl.phone : pl.notes || 'Gulzar CC Squad'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="primary" style={{ textTransform: 'capitalize', fontSize: '10.5px' }}>
                        {pl.role?.replace('_', ' ')}
                      </Badge>
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {pl.battingStyle?.replace('_', ' ')}
                      </div>
                    </TableCell>

                    <TableCell style={{ fontWeight: 700 }}>{pl.matchesPlayed || 0}</TableCell>

                    <TableCell style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                      Rs. {fNum(pl.totalFeePaid)}
                    </TableCell>

                    <TableCell>
                      {(pl.pendingDue || 0) > 0 ? (
                        <span className="cell-due-val" style={{ fontSize: '11.5px', padding: '1px 6px' }}>
                          Rs. {fNum(pl.pendingDue)} Due
                        </span>
                      ) : (
                        <Badge variant="success" icon={<CheckCircle2 size={10} />} style={{ fontSize: '10.5px' }}>
                          Cleared
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
                        <Button
                          variant="success"
                          size="sm"
                          icon={<DollarSign size={13} />}
                          onClick={() => openFeeModal(pl)}
                          title="Collect / Pay Match Fee"
                        >
                          Pay Fee
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          icon={<Pencil size={13} color="var(--accent-blue)" />}
                          onClick={() => handleEditOpen(pl)}
                          title="Edit Player"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          isIconOnly
                          icon={<Trash2 size={13} />}
                          onClick={() => handleDelete(pl._id, pl.name)}
                          title="Deactivate Player"
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
                      <div className="player-card-avatar">
                        {pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== ''
                          ? `#${pl.jerseyNumber}`
                          : pl.name.substring(0, 2).toUpperCase()}
                      </div>

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

                    {/* Stats strip: Matches, Paid, Due */}
                    <div className="player-card-stats-row">
                      <div className="player-stat-col">
                        <span className="player-stat-label">Matches</span>
                        <span className="player-stat-val">{pl.matchesPlayed || 0}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Paid</span>
                        <span className="player-stat-val player-stat-paid">Rs. {fNum(pl.totalFeePaid)}</span>
                      </div>
                      <div className="player-stat-col">
                        <span className="player-stat-label">Due</span>
                        <span className={`player-stat-val ${hasDue ? 'player-stat-due' : ''}`}>
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
                          icon={<DollarSign size={12} />}
                          onClick={() => openFeeModal(pl)}
                          title="Collect / Pay Match Fee"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                        >
                          Pay
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
        <Modal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          title="Register New Player"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreate}>
                Save Player
              </Button>
            </>
          }
        >
          <form onSubmit={handleCreate}>
            <div className="grid-2">
              <Input
                label="Full Name *"
                placeholder="e.g. Jawad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />

              <Input
                label="Phone / WhatsApp"
                placeholder="e.g. 0300-1234567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <Select
                label="Player Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                options={[
                  { value: 'all_rounder', label: 'All-Rounder' },
                  { value: 'batsman', label: 'Batsman' },
                  { value: 'bowler', label: 'Bowler' },
                  { value: 'wicket_keeper', label: 'Wicket-Keeper' },
                ]}
              />

              <Input
                label="Jersey Number"
                type="number"
                placeholder="e.g. 20"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
              />
            </div>

            <Input
              label="Kit Notes / Sizes"
              placeholder="e.g. Code: JS-20 | Shirt: XL | Trouser: XL"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Edit Player */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Player Details"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdate}>
            <div className="grid-2">
              <Input
                label="Player Name *"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />

              <Input
                label="Jersey Number"
                type="number"
                value={editFormData.jerseyNumber}
                onChange={(e) => setEditFormData({ ...editFormData, jerseyNumber: e.target.value })}
              />
            </div>

            <div className="grid-2">
              <Select
                label="Role"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                options={[
                  { value: 'all_rounder', label: 'All-Rounder' },
                  { value: 'batsman', label: 'Batsman' },
                  { value: 'bowler', label: 'Bowler' },
                  { value: 'wicket_keeper', label: 'Wicket-Keeper' },
                ]}
              />

              <Input
                label="Phone / WhatsApp"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <Input
              label="Kit Notes & Sizes"
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Collect Match Fee */}
        <Modal
          isOpen={isFeeModalOpen}
          onClose={() => setIsFeeModalOpen(false)}
          title={`Collect Match Fee — ${selectedPlayerForFee?.name || 'Player'}`}
          maxWidth="750px"
        >
          {feeModalLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading player fee ledger...
            </div>
          ) : (
            <div>
              {/* Player Financial Summary Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                  padding: '14px',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Total Collected
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)' }}>
                    Rs. {fNum(selectedPlayerForFee?.totalFeePaid || 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Outstanding Due
                  </div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: (selectedPlayerForFee?.pendingDue || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-green)',
                    }}
                  >
                    {(selectedPlayerForFee?.pendingDue || 0) > 0
                      ? `Rs. ${fNum(selectedPlayerForFee?.pendingDue)} Due`
                      : '100% Cleared'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Matches Tracked
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-blue)' }}>
                    {playerMatches.length} Matches
                  </div>
                </div>
              </div>

              {/* SECTION 1: PENDING MATCH DUES */}
              {(() => {
                const pendingMatches = playerMatches.filter((p) => p.paymentStatus !== 'paid');
                const totalPending = pendingMatches.reduce(
                  (sum, p) => sum + ((p.feeAssigned || 0) - (p.feePaid || 0)),
                  0
                );

                return (
                  <div style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      <h4
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          margin: 0,
                        }}
                      >
                        <AlertCircle size={15} color={pendingMatches.length > 0 ? 'var(--accent-rose)' : 'var(--accent-green)'} />
                        Pending Match Fees ({pendingMatches.length})
                      </h4>

                      {pendingMatches.length > 0 && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={<CheckCircle2 size={14} />}
                          onClick={handleClearAllPendingDues}
                        >
                          ⚡ Clear All Pending Dues (Rs. {fNum(totalPending)})
                        </Button>
                      )}
                    </div>

                    {pendingMatches.length === 0 ? (
                      <div
                        style={{
                          padding: '16px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: '#065f46',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        <CheckCircle2 size={16} color="#059669" />
                        All previous match fees are 100% cleared! No outstanding dues.
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Match / Venue</TableHead>
                            <TableHead>Assigned</TableHead>
                            <TableHead>Paid</TableHead>
                            <TableHead>Balance Due</TableHead>
                            <TableHead align="right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pendingMatches.map((rec) => {
                            const due = (rec.feeAssigned || 0) - (rec.feePaid || 0);
                            const match = rec.matchId;
                            return (
                              <TableRow key={rec._id}>
                                <TableCell>
                                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                    vs {match?.opponentTeam || 'Opponent'}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {match?.venue || 'Venue'} • {match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : ''}
                                  </div>
                                </TableCell>
                                <TableCell>Rs. {fNum(rec.feeAssigned)}</TableCell>
                                <TableCell style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>
                                  Rs. {fNum(rec.feePaid)}
                                </TableCell>
                                <TableCell style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                                  Rs. {fNum(due)}
                                </TableCell>
                                <TableCell align="right">
                                  <Button
                                    variant="success"
                                    size="sm"
                                    icon={<CheckCircle2 size={13} />}
                                    onClick={() => handleQuickPayMatch(rec._id, rec.feeAssigned)}
                                    title="1-Click Mark Cleared"
                                  >
                                    Mark Paid
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })()}

              {/* SECTION 2: ASSIGN / RECORD NEW MATCH FEE */}
              <div
                style={{
                  padding: '16px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: 'var(--accent-blue)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>Assign / Collect Fee for Another Match</span>
                </div>
                <form onSubmit={handleCreateMatchFee}>
                  <div className="grid-2" style={{ marginBottom: '10px' }}>
                    <Select
                      label="Select Match *"
                      value={newMatchPayment.matchId}
                      onChange={(e) => {
                        const mId = e.target.value;
                        const selectedM = allMatches.find((m) => m._id === mId);
                        setNewMatchPayment({
                          ...newMatchPayment,
                          matchId: mId,
                          feeAssigned: selectedM?.perPlayerFee || 1000,
                          feePaid: selectedM?.perPlayerFee || 1000,
                        });
                      }}
                      required
                      options={[
                        { value: '', label: '— Choose Match —' },
                        ...allMatches.map((m) => ({
                          value: m._id,
                          label: `vs ${m.opponentTeam} (${new Date(m.matchDate).toLocaleDateString()}) - ${m.venue || ''}`,
                        })),
                      ]}
                    />
                    <Select
                      label="Payment Method"
                      value={newMatchPayment.paymentMethod}
                      onChange={(e) =>
                        setNewMatchPayment({ ...newMatchPayment, paymentMethod: e.target.value })
                      }
                      options={[
                        { value: 'cash', label: 'Cash' },
                        { value: 'easypaisa', label: 'EasyPaisa' },
                        { value: 'jazzcash', label: 'JazzCash' },
                        { value: 'bank_transfer', label: 'Bank Transfer' },
                      ]}
                    />
                  </div>
                  <div className="grid-2" style={{ marginBottom: '14px' }}>
                    <Input
                      label="Fee Assigned (Rs.) *"
                      type="number"
                      value={newMatchPayment.feeAssigned}
                      onChange={(e) =>
                        setNewMatchPayment({
                          ...newMatchPayment,
                          feeAssigned: Number(e.target.value),
                        })
                      }
                      required
                    />
                    <Input
                      label="Fee Paid (Rs.) *"
                      type="number"
                      value={newMatchPayment.feePaid}
                      onChange={(e) =>
                        setNewMatchPayment({
                          ...newMatchPayment,
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
                      onClick={() => setIsFeeModalOpen(false)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      type="submit"
                      icon={<DollarSign size={14} />}
                    >
                      Save Match Fee
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
}
