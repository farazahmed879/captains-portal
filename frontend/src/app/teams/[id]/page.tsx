'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/Header';
import { StatCard } from '../../../components/StatCard';
import { fetchApi } from '../../../lib/api';
import {
  Button,
  Badge,
  Input,
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
} from '../../../components/ui';
import {
  Shield,
  Users,
  Swords,
  Trophy,
  ArrowLeft,
  DollarSign,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  ExternalLink,
} from '../../../components/icons';

export default function TeamProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'matches' | 'tournaments'>('squad');

  // Edit Team Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    shortName: '',
    city: '',
    primaryColor: '#0ea5e9',
    description: '',
  });

  const loadTeamProfile = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{
      success: boolean;
      team: any;
      players: any[];
      matches: any[];
      tournaments: any[];
      stats: any;
    }>(`/teams/${id}`)
      .then((res) => {
        if (res.success) {
          setData(res);
          const t = res.team;
          setEditFormData({
            name: t.name || '',
            shortName: t.shortName || '',
            city: t.city || '',
            primaryColor: t.primaryColor || '#0ea5e9',
            description: t.description || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTeamProfile();
  }, [id]);

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadTeamProfile();
      }
    } catch (err) {
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async () => {
    if (!confirm(`Are you sure you want to delete team "${data?.team?.name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/teams');
      }
    } catch (err) {
      alert('Failed to delete team');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Team Profile...
      </div>
    );
  }

  if (!data?.team) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Team not found. <Link href="/teams">Back to Teams</Link>
      </div>
    );
  }

  const { team, players = [], matches = [], tournaments = [], stats = {} } = data;
  const winRate =
    stats.winRate ||
    (stats.totalMatches ? Math.round((stats.matchesWon / stats.totalMatches) * 100) : 0);

  return (
    <>
      <Header
        title={`${team.name} - Profile`}
        subtitle="Complete Team Franchise Details, Squad Roster, Match Record & Tournaments"
      />

      <div className="content-body">
        {/* Navigation & Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Link href="/teams" passHref legacyBehavior>
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>
              Back to All Teams
            </Button>
          </Link>

          <div className="action-group">
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil size={13} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Team
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDeleteTeam}
            >
              Delete
            </Button>
          </div>
        </div>

        {/* Hero Card */}
        <Card style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: team.primaryColor || '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(2, 132, 199, 0.25)',
                  letterSpacing: '1px',
                }}
              >
                {team.shortName || team.name.slice(0, 3).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Badge variant="purple">{team.shortName || 'GCT'}</Badge>
                  <Badge variant="primary">FRANCHISE</Badge>
                  <Badge variant="success">WIN RATE {winRate}%</Badge>
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {team.name}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="var(--accent-blue)" />
                    {team.city || 'Karachi, Pakistan'}
                  </span>
                  {team.captainId?.name && (
                    <span>
                      Captain: <strong style={{ color: 'var(--text-primary)' }}>{team.captainId.name}</strong>
                    </span>
                  )}
                  <span>
                    Record:{' '}
                    <strong style={{ color: 'var(--accent-green)' }}>{stats.matchesWon || 0}W</strong> -{' '}
                    <strong style={{ color: 'var(--accent-rose)' }}>{stats.matchesLost || 0}L</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Total Expenditures Outflow */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Match Expenses
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: 'var(--accent-blue)',
                }}
              >
                Rs. {fNum(stats.totalMatchExpenses)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Across {stats.totalMatches || matches.length} matches played
              </div>
            </div>
          </div>

          {team.description && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              🏏 {team.description}
            </div>
          )}
        </Card>

        {/* 4 Stat Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard
            variant="blue"
            title="Active Squad"
            value={`${players.length} Players`}
            subtitle="Registered Squad Members"
            icon={<Users size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="emerald"
            title="Matches Played"
            value={`${stats.totalMatches || matches.length} Matches`}
            subtitle={`${stats.matchesWon || 0} Victories Won`}
            icon={<Swords size={20} color="var(--accent-green)" />}
          />
          <StatCard
            variant="amber"
            title="Tournaments"
            value={`${tournaments.length} Seasons`}
            subtitle="Participated Leagues"
            icon={<Trophy size={20} color="var(--accent-amber)" />}
          />
          <StatCard
            variant="purple"
            title="Win Percentage"
            value={`${winRate}%`}
            subtitle={`${stats.matchesWon || 0}W / ${stats.matchesLost || 0}L`}
            icon={<Shield size={20} color="var(--accent-purple)" />}
          />
        </div>

        {/* Tabs for Squad, Matches, Tournaments */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '12px',
          }}
        >
          <Button
            variant={activeTab === 'squad' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('squad')}
          >
            Squad Roster ({players.length})
          </Button>
          <Button
            variant={activeTab === 'matches' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('matches')}
          >
            Match Log ({matches.length})
          </Button>
          <Button
            variant={activeTab === 'tournaments' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab('tournaments')}
          >
            Tournaments ({tournaments.length})
          </Button>
        </div>

        {/* TAB 1: SQUAD ROSTER */}
        {activeTab === 'squad' && (
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Users size={16} color="var(--accent-blue)" />
              Registered Squad Members ({players.length})
            </h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jersey #</TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Batting Style</TableHead>
                  <TableHead>Bowling Style</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.length === 0 ? (
                  <TableEmpty colSpan={7} message="No players assigned to this team roster yet." />
                ) : (
                  players.map((p: any) => (
                    <TableRow key={p._id}>
                      <TableCell>
                        <Badge variant="purple" style={{ fontWeight: 800 }}>
                          {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/players/${p._id}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          {p.name}
                          <ExternalLink size={10} color="var(--accent-blue)" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {p.role?.replace('_', ' ').toUpperCase() || 'PLAYER'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {p.battingStyle?.replace('_', ' ') || 'Right Hand'}
                      </TableCell>
                      <TableCell
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {p.bowlingStyle?.replace('_', ' ') || 'N/A'}
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {p.phone || '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Link href={`/players/${p._id}`} passHref legacyBehavior>
                          <Button variant="secondary" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* TAB 2: MATCH LOG */}
        {activeTab === 'matches' && (
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Swords size={16} color="var(--accent-blue)" />
              Matches Played ({matches.length})
            </h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Match</TableHead>
                  <TableHead>Type / League</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Match Expense</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableEmpty colSpan={7} message="No matches recorded for this team yet." />
                ) : (
                  matches.map((m: any) => (
                    <TableRow key={m._id}>
                      <TableCell>
                        <Link
                          href={`/matches/${m._id}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          vs {m.opponentTeam}
                          <ExternalLink size={10} color="var(--accent-blue)" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        {m.tournamentId ? (
                          <Link
                            href={`/tournaments/${m.tournamentId._id}`}
                            style={{
                              color: 'var(--accent-blue)',
                              textDecoration: 'none',
                              fontSize: '12px',
                            }}
                          >
                            🏆 {m.tournamentId.name}
                          </Link>
                        ) : (
                          <Badge variant="secondary">Friendly</Badge>
                        )}
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {new Date(m.matchDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {m.venue || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            m.result === 'won'
                              ? 'success'
                              : m.result === 'lost'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {m.result ? m.result.toUpperCase() : 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontWeight: 600 }}>Rs. {fNum(m.totalMatchExpense)}</TableCell>
                      <TableCell align="right">
                        <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                          <Button variant="secondary" size="sm">
                            View Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* TAB 3: TOURNAMENTS */}
        {activeTab === 'tournaments' && (
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Trophy size={16} color="var(--accent-blue)" />
              Tournaments Participated ({tournaments.length})
            </h3>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Entry Fee</TableHead>
                  <TableHead>Prize Won</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead align="right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.length === 0 ? (
                  <TableEmpty colSpan={7} message="No tournaments linked to this team yet." />
                ) : (
                  tournaments.map((t: any) => (
                    <TableRow key={t._id}>
                      <TableCell>
                        <Link
                          href={`/tournaments/${t._id}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          🏆 {t.name}
                          <ExternalLink size={10} color="var(--accent-blue)" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="purple">{t.format || 'Hard Ball'}</Badge>
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {t.venue || '-'}
                      </TableCell>
                      <TableCell>Rs. {fNum(t.entryFee)}</TableCell>
                      <TableCell style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                        Rs. {fNum(t.actualWinningPrizeWon)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === 'champions'
                              ? 'gold'
                              : t.status === 'ongoing'
                              ? 'primary'
                              : 'warning'
                          }
                        >
                          {t.status?.toUpperCase() || 'COMPLETED'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <Link href={`/tournaments/${t._id}`} passHref legacyBehavior>
                          <Button variant="secondary" size="sm">
                            View Tournament
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Edit Team Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Team: ${team.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateTeam}>
              Save Team Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateTeam}>
          <div className="grid-2">
            <Input
              label="Team Name *"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
            <Input
              label="Short Code *"
              placeholder="e.g. GCT"
              value={editFormData.shortName}
              onChange={(e) => setEditFormData({ ...editFormData, shortName: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="City / Home Ground"
              value={editFormData.city}
              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
            />
            <div className="form-group">
              <label className="form-label">Primary Theme Color</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={editFormData.primaryColor}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, primaryColor: e.target.value })
                  }
                  style={{
                    width: '42px',
                    height: '38px',
                    padding: '0',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                  }}
                />
                <Input
                  value={editFormData.primaryColor}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, primaryColor: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Textarea
            label="Description / Franchise Bio"
            rows={3}
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
          />
        </form>
      </Modal>
    </>
  );
}
