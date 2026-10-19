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
} from '../../components/icons';

export default function PlayersPage() {
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

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  return (
    <>
      <Header
        title="Player Rosters & Payment Ledgers"
        subtitle="Manage Player Profiles, Fees Assigned vs Paid, and Edit/Delete Player Details"
        selectedTeamId={selectedTeamId}
        onTeamChange={setSelectedTeamId}
      />

      <div className="content-body">
        {/* Controls */}
        <div className="filter-bar">
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: '250px' }}>
              <Input
                placeholder="Search player name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search size={14} />}
              />
            </div>

            <div style={{ width: '160px' }}>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'batsman', label: 'Batsman' },
                  { value: 'bowler', label: 'Bowler' },
                  { value: 'all_rounder', label: 'All-Rounder' },
                  { value: 'wicket_keeper', label: 'Wicket-Keeper' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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

        {/* VIEW 1: TABLE VIEW */}
        {viewMode === 'table' && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player & Jersey</TableHead>
                <TableHead>Role & Details</TableHead>
                <TableHead>Matches Played</TableHead>
                <TableHead>Total Fee Paid</TableHead>
                <TableHead>Remaining Due</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableEmpty colSpan={6} message="No players found." />
              ) : (
                players.map((pl) => (
                  <TableRow key={pl._id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: '#e0f2fe',
                            border: '1px solid #bae6fd',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#0369a1',
                            fontSize: '13px',
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
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {pl.notes || 'Gulzar CC Squad'}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="primary" style={{ textTransform: 'capitalize' }}>
                        {pl.role.replace('_', ' ')}
                      </Badge>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {pl.battingStyle?.replace('_', ' ')}
                      </div>
                    </TableCell>

                    <TableCell style={{ fontWeight: 700 }}>{pl.matchesPlayed || 0} Matches</TableCell>

                    <TableCell style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
                      Rs. {fNum(pl.totalFeePaid)}
                    </TableCell>

                    <TableCell>
                      {(pl.pendingDue || 0) > 0 ? (
                        <Badge variant="danger">Rs. {fNum(pl.pendingDue)} Due</Badge>
                      ) : (
                        <Badge variant="success" icon={<CheckCircle2 size={11} />}>
                          Cleared
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell align="right">
                      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                        <Link href={`/players/${pl._id}`} passHref legacyBehavior>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<Eye size={12} color="var(--accent-blue)" />}
                            title="View Full Profile Page"
                          >
                            Profile
                          </Button>
                        </Link>
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
        )}

        {/* VIEW 2: GRID (CARDS) VIEW */}
        {viewMode === 'grid' && (
          <div className="grid-3">
            {players.map((pl) => (
              <Card key={pl._id} variant={(pl.pendingDue || 0) > 0 ? 'rose' : 'emerald'} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '15px',
                      boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    {pl.jerseyNumber ? `#${pl.jerseyNumber}` : pl.name.substring(0, 2).toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      href={`/players/${pl._id}`}
                      style={{
                        fontSize: '16px',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.name}
                      </span>
                      <ExternalLink size={11} color="var(--accent-blue)" />
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Badge variant="purple" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                        {pl.role?.replace('_', ' ') || 'Player'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '10px 12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '14px',
                    fontSize: '12px',
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                      Matches
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {pl.matchesPlayed || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>
                      Fee Paid
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '14px' }}>
                      Rs. {fNum(pl.totalFeePaid)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  <div>
                    {(pl.pendingDue || 0) > 0 ? (
                      <Badge variant="danger">Rs. {fNum(pl.pendingDue)} Due</Badge>
                    ) : (
                      <Badge variant="success">Cleared</Badge>
                    )}
                  </div>

                  <div className="action-group">
                    <Link href={`/players/${pl._id}`} passHref legacyBehavior>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Eye size={12} color="var(--accent-blue)" />}
                      >
                        Profile
                      </Button>
                    </Link>
                    <Button
                      variant="secondary"
                      size="sm"
                      isIconOnly
                      icon={<Pencil size={12} color="var(--accent-blue)" />}
                      onClick={() => handleEditOpen(pl)}
                      title="Edit"
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      isIconOnly
                      icon={<Trash2 size={12} />}
                      onClick={() => handleDelete(pl._id, pl.name)}
                      title="Deactivate"
                    />
                  </div>
                </div>
              </Card>
            ))}
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
      </div>
    </>
  );
}
