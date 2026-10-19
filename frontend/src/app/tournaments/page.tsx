'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/Header';
import { fetchApi } from '../../lib/api';
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
  ViewSwitcher,
} from '../../components/ui';
import {
  PlusIcon,
  SearchIcon,
  ExternalLinkIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  MapPinIcon,
  CalendarIcon,
} from '../../components/icons';

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    teamId: '',
    name: '',
    organizer: '',
    venue: '',
    format: 'Tape Ball',
    startDate: '',
    endDate: '',
    entryFee: '',
    expectedWinningPrize: '',
    actualWinningPrizeWon: '',
    status: 'ongoing',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    organizer: '',
    venue: '',
    format: 'Tape Ball',
    entryFee: 0,
    expectedWinningPrize: 0,
    actualWinningPrizeWon: 0,
    status: 'ongoing',
    notes: '',
  });

  const loadData = () => {
    setLoading(true);
    const query = selectedTeamId ? `?teamId=${selectedTeamId}` : '';
    Promise.all([
      fetchApi<{ success: boolean; tournaments: any[] }>(`/tournaments${query}`),
      fetchApi<{ success: boolean; teams: any[] }>('/teams'),
    ])
      .then(([tournRes, teamsRes]) => {
        if (tournRes.success) setTournaments(tournRes.tournaments);
        if (teamsRes.success) {
          setTeams(teamsRes.teams);
          if (teamsRes.teams.length > 0 && !formData.teamId) {
            setFormData((prev) => ({ ...prev, teamId: teamsRes.teams[0]._id }));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedTeamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean; tournament: any }>('/tournaments', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          entryFee: Number(formData.entryFee) || 0,
          expectedWinningPrize: Number(formData.expectedWinningPrize) || 0,
          actualWinningPrizeWon: Number(formData.actualWinningPrizeWon) || 0,
        }),
      });
      if (res.success) {
        setIsModalOpen(false);
        setFormData({
          teamId: teams[0]?._id || '',
          name: '',
          organizer: '',
          venue: '',
          format: 'Tape Ball',
          startDate: '',
          endDate: '',
          entryFee: '',
          expectedWinningPrize: '',
          actualWinningPrizeWon: '',
          status: 'ongoing',
          notes: '',
        });
        loadData();
      }
    } catch (err) {
      alert('Failed to register tournament');
    }
  };

  const handleEditOpen = (trn: any) => {
    setEditFormData({
      id: trn._id,
      name: trn.name,
      organizer: trn.organizer || '',
      venue: trn.venue || '',
      format: trn.format || 'Hard Ball',
      entryFee: trn.entryFee || 0,
      expectedWinningPrize: trn.expectedWinningPrize || 0,
      actualWinningPrizeWon: trn.actualWinningPrizeWon || 0,
      status: trn.status || 'ongoing',
      notes: trn.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update tournament');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete tournament "${name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${id}`, { method: 'DELETE' });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      alert('Failed to delete tournament');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.venue || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'champions':
        return 'gold' as const;
      case 'ongoing':
        return 'primary' as const;
      case 'completed':
        return 'success' as const;
      default:
        return 'warning' as const;
    }
  };

  return (
    <>
      <Header
        title="Tournaments & Leagues Financials"
        subtitle="Manage Tournament Entries, Prize Returns, Dedicated Sponsors & Edit/Delete Records"
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
      />

      <div className="content-body">
        {/* Controls: Search, Status Filter, View Toggle, Add Button */}
        <div className="filter-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ width: '260px' }}>
              <Input
                placeholder="Search tournaments or venues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<SearchIcon size={14} />}
              />
            </div>

            <div className="pill-group">
              {['all', 'ongoing', 'champions', 'completed'].map((st) => (
                <button
                  key={st}
                  className={`pill-btn ${statusFilter === st ? 'active' : ''}`}
                  onClick={() => setStatusFilter(st)}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            <Button
              variant="primary"
              size="sm"
              icon={<PlusIcon size={15} />}
              onClick={() => setIsModalOpen(true)}
            >
              Add Tournament
            </Button>
          </div>
        </div>

        {/* VIEW 1: TABLE (LIST) VIEW */}
        {viewMode === 'table' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Venue & Date</TableHead>
                <TableHead>Entry Fee</TableHead>
                <TableHead>Match Costs</TableHead>
                <TableHead>Prize Won</TableHead>
                <TableHead>Net ROI</TableHead>
                <TableHead>Status</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTournaments.length === 0 ? (
                <TableEmpty colSpan={9} message="No tournaments found matching criteria." />
              ) : (
                filteredTournaments.map((trn) => {
                  const netPnl = trn.financials?.netPnl ?? 0;
                  const isProfitable = netPnl >= 0;
                  return (
                    <TableRow key={trn._id}>
                      <TableCell>
                        <Link
                          href={`/tournaments/${trn._id}`}
                          style={{
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span>{trn.name}</span>
                          <ExternalLinkIcon size={11} color="var(--accent-blue)" />
                        </Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Team: {trn.teamId?.name || 'Gulzar Cricket Team'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="purple">{trn.format || 'Hard Ball'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ fontSize: '13px' }}>{trn.venue || 'Karachi Grounds'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(trn.startDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>
                        Rs. {fNum(trn.financials?.entryFee || trn.entryFee)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(trn.financials?.matchExpenses || 0)}
                      </TableCell>
                      <TableCell style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
                        Rs. {fNum(trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon || 0)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isProfitable ? 'success' : 'danger'}>
                          {isProfitable ? '+' : ''}Rs. {fNum(netPnl)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(trn.status)}>
                          {trn.status?.toUpperCase() || 'ONGOING'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          <Link href={`/tournaments/${trn._id}`} passHref legacyBehavior>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<EyeIcon size={12} color="var(--accent-blue)" />}
                              title="View Tournament Profile"
                            >
                              Details
                            </Button>
                          </Link>
                          <Button
                            variant="secondary"
                            size="sm"
                            isIconOnly
                            icon={<PencilIcon size={13} color="var(--accent-blue)" />}
                            onClick={() => handleEditOpen(trn)}
                            title="Edit Tournament"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            isIconOnly
                            icon={<TrashIcon size={13} />}
                            onClick={() => handleDelete(trn._id, trn.name)}
                            title="Delete Tournament"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}

        {/* VIEW 2: GRID (CARDS) VIEW */}
        {viewMode === 'grid' && (
          <div className="grid-2">
            {filteredTournaments.map((trn) => {
              const isProfitable = (trn.financials?.netPnl || 0) >= 0;
              return (
                <Card key={trn._id} variant={isProfitable ? 'emerald' : 'amber'} style={{ position: 'relative' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Badge variant="purple">{trn.format}</Badge>
                        <Badge variant={getStatusBadgeVariant(trn.status)}>
                          {trn.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <Link
                        href={`/tournaments/${trn._id}`}
                        style={{
                          fontSize: '19px',
                          fontWeight: 800,
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>{trn.name}</span>
                        <ExternalLinkIcon size={12} color="var(--accent-blue)" />
                      </Link>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '4px',
                        }}
                      >
                        <MapPinIcon size={12} />
                        <span>{trn.venue || 'Karachi Grounds'}</span>
                        <span>•</span>
                        <CalendarIcon size={12} />
                        <span>{new Date(trn.startDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="action-group">
                      <Button
                        variant="secondary"
                        size="sm"
                        isIconOnly
                        icon={<PencilIcon size={13} color="var(--accent-blue)" />}
                        onClick={() => handleEditOpen(trn)}
                        title="Edit Tournament"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        isIconOnly
                        icon={<TrashIcon size={13} />}
                        onClick={() => handleDelete(trn._id, trn.name)}
                        title="Delete Tournament"
                      />
                    </div>
                  </div>

                  {trn.notes && (
                    <p
                      style={{
                        fontSize: '12.5px',
                        color: 'var(--text-muted)',
                        marginBottom: '16px',
                        background: '#f8fafc',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      🏆 {trn.notes}
                    </p>
                  )}

                  {/* Financial Breakdown Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '10px',
                      padding: '12px',
                      background: '#f8fafc',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                      textAlign: 'center',
                      marginBottom: '14px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Entry Fee
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Rs. {fNum(trn.financials?.entryFee || trn.entryFee)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Match Costs
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(trn.financials?.matchExpenses)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Prize Won
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)' }}>
                        Rs. {fNum(trn.financials?.actualWinningPrizeWon || trn.actualWinningPrizeWon)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                        Net ROI
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: isProfitable ? 'var(--accent-green)' : 'var(--accent-rose)',
                        }}
                      >
                        {isProfitable ? '+' : ''}Rs. {fNum(trn.financials?.netPnl)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '12px',
                      color: 'var(--text-secondary)',
                      marginBottom: '12px',
                    }}
                  >
                    <div>
                      Team: <strong style={{ color: 'var(--text-primary)' }}>{trn.teamId?.name || 'Gulzar Cricket Team'}</strong>
                    </div>
                    <div>
                      Matches: <strong style={{ color: 'var(--accent-blue)' }}>{trn.matchesPlayed || 0} Matches Recorded</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-color)',
                    }}
                  >
                    <Link href={`/tournaments/${trn._id}`} passHref legacyBehavior>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<EyeIcon size={12} color="var(--accent-blue)" />}
                      >
                        View Tournament Profile & Matches
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Add Tournament */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Tournament or League"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmit}>
                Save Tournament
              </Button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <Select
                label="Participating Team *"
                value={formData.teamId}
                onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                required
                options={teams.map((team) => ({ value: team._id, label: team.name }))}
              />

              <Input
                label="Tournament Name *"
                placeholder="e.g. Catchy Classic 26"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid-2">
              <Select
                label="Format"
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                options={[
                  { value: 'Hard Ball', label: 'Hard Ball' },
                  { value: 'Tape Ball', label: 'Tape Ball' },
                  { value: 'T20', label: 'T20' },
                  { value: 'T10', label: 'T10' },
                  { value: '100 Balls', label: '100 Balls' },
                ]}
              />

              <Input
                label="Ground Venue"
                placeholder="e.g. Landhi / Korangi Eidgah"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              />
            </div>

            <div className="grid-3">
              <Input
                label="Entry Fee (Investment) *"
                type="number"
                placeholder="50000"
                value={formData.entryFee}
                onChange={(e) => setFormData({ ...formData, entryFee: e.target.value })}
                required
              />

              <Input
                label="Expected / Winning Prize"
                type="number"
                placeholder="145000"
                value={formData.expectedWinningPrize}
                onChange={(e) => setFormData({ ...formData, expectedWinningPrize: e.target.value })}
              />

              <Input
                label="Actual Prize Won (if any)"
                type="number"
                placeholder="30000"
                value={formData.actualWinningPrizeWon}
                onChange={(e) => setFormData({ ...formData, actualWinningPrizeWon: e.target.value })}
              />
            </div>

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'completed', label: 'Completed' },
                { value: 'champions', label: 'Champions' },
              ]}
            />

            <Textarea
              label="Notes / Remarks"
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </form>
        </Modal>

        {/* Modal: Edit Tournament */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Tournament Record"
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
                label="Tournament Name *"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />

              <Select
                label="Format"
                value={editFormData.format}
                onChange={(e) => setEditFormData({ ...editFormData, format: e.target.value })}
                options={[
                  { value: 'Hard Ball', label: 'Hard Ball' },
                  { value: 'Tape Ball', label: 'Tape Ball' },
                  { value: 'T20', label: 'T20' },
                  { value: 'T10', label: 'T10' },
                  { value: '100 Balls', label: '100 Balls' },
                ]}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Venue / Stadium"
                value={editFormData.venue}
                onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
              />

              <Select
                label="Status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                options={[
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'champions', label: 'Champions' },
                ]}
              />
            </div>

            <div className="grid-3">
              <Input
                label="Entry Fee (Rs.)"
                type="number"
                value={editFormData.entryFee}
                onChange={(e) => setEditFormData({ ...editFormData, entryFee: Number(e.target.value) })}
              />

              <Input
                label="Expected / Winning Prize"
                type="number"
                value={editFormData.expectedWinningPrize}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, expectedWinningPrize: Number(e.target.value) })
                }
              />

              <Input
                label="Actual Prize Won (Rs.)"
                type="number"
                value={editFormData.actualWinningPrizeWon}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, actualWinningPrizeWon: Number(e.target.value) })
                }
              />
            </div>

            <Textarea
              label="Remarks / Notes"
              rows={2}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </>
  );
}
