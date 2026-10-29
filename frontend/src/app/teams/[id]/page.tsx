'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';
import { StatCard } from '../../../components/StatCard';
import { fetchApi } from '../../../lib/api';
import { confirmDelete, showToast } from '../../../lib/alerts';
import {
  Button,
  Badge,
  Input,
  Textarea,
  Modal,
  Card,
  DataTable,
} from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditTeamModal } from '../../../components/EditTeamModal';
import { ManageTeamPlayersModal } from '../../../components/ManageTeamPlayersModal';
import {
  Plus,
  Shield,
  Users,
  Swords,
  Trophy,
  ArrowLeft,
  DollarSign,
  Pencil,
  Trash2,
  MapPin,
  Phone,
  Calendar,
  ExternalLink,
} from '../../../components/icons';

export default function TeamProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'squad' | 'matches' | 'tournaments'>('squad');

  // Edit Team Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  // Add Players Modal state
  const [isAddPlayersOpen, setIsAddPlayersOpen] = useState<boolean>(false);

  const teamQuery = useQuery({
    queryKey: queryKeys.team(id),
    queryFn: () =>
      fetchApi<{
        success: boolean;
        team: any;
        players: any[];
        matches: any[];
        tournaments: any[];
        stats: any;
      }>(`/teams/${id}`),
    enabled: !!id,
  });

  const data = teamQuery.data;
  const loading = teamQuery.isLoading;

  const invalidateTeam = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.team(id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.teams() });
    queryClient.invalidateQueries({ queryKey: queryKeys.players() });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleDeleteTeam = async () => {
    const confirmed = await confirmDelete(`team "${data?.team?.name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Team "${data?.team?.name}" deleted.`);
        router.push('/teams');
      }
    } catch (err) {
      showToast.error('Failed to delete team.');
    }
  };

  const handleRemovePlayerFromTeam = async (playerId: string, playerName: string) => {
    const confirmed = await confirmDelete(`"${playerName}" from ${data?.team?.name} squad`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${id}/players/${playerId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast.success(`${playerName} removed from ${data?.team?.name} squad.`);
        invalidateTeam();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to remove player from team.');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  if (loading) {
    return (
      <>
        <Header
          title="Team Profile"
          subtitle="Complete Team Franchise Details, Squad Roster, Match Record & Tournaments"
        />
        <div className="content-body">
          <DetailPageSkeleton />
        </div>
      </>
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
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsAddPlayersOpen(true)}
            >
              Add Players to Team
            </Button>
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
                    flexWrap: 'wrap',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} color="var(--accent-blue)" />
                    {team.city || 'Karachi, Pakistan'}
                  </span>
                  {(team.phone || team.captain?.phone) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={13} color="var(--accent-green)" />
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {team.phone || team.captain?.phone}
                      </strong>
                    </span>
                  )}
                  {(team.captain?.name || team.captainId?.name) && (
                    <span>
                      Captain:{' '}
                      <strong style={{ color: 'var(--text-primary)' }}>
                        {team.captain?.name || team.captainId?.name}
                      </strong>
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
              {team.description}
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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Users size={16} color="var(--accent-blue)" />
                Registered Squad Members ({players.length})
              </h3>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setIsAddPlayersOpen(true)}
              >
                Add Players
              </Button>
            </div>

            <DataTable
              data={players}
              keyExtractor={(p: any) => p._id}
              emptyMessage="No players assigned to this team roster yet. Click '+ Add Players' to build your squad."
              columns={[
                {
                  header: 'Jersey #',
                  width: '10%',
                  render: (p: any) => (
                    <Badge variant="purple" style={{ fontWeight: 800 }}>
                      {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
                    </Badge>
                  ),
                },
                {
                  header: 'Player',
                  width: '22%',
                  render: (p: any) => (
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
                  ),
                },
                {
                  header: 'Role',
                  width: '14%',
                  render: (p: any) => (
                    <Badge variant="secondary">
                      {p.role?.replace('_', ' ').toUpperCase() || 'PLAYER'}
                    </Badge>
                  ),
                },
                {
                  header: 'Batting Style',
                  width: '15%',
                  style: { textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (p: any) => p.battingStyle?.replace('_', ' ') || 'Right Hand',
                },
                {
                  header: 'Bowling Style',
                  width: '15%',
                  style: { textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (p: any) => p.bowlingStyle?.replace('_', ' ') || 'N/A',
                },
                {
                  header: 'Phone',
                  width: '12%',
                  style: { fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (p: any) => p.phone || '-',
                },
                {
                  header: 'Action',
                  width: '12%',
                  align: 'right',
                  render: (p: any) => (
                    <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                      <Link href={`/players/${p._id}`} passHref legacyBehavior>
                        <Button variant="secondary" size="sm">
                          Profile
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        isIconOnly
                        title="Remove from Team Squad"
                        icon={<Trash2 size={13} />}
                        onClick={() => handleRemovePlayerFromTeam(p._id, p.name)}
                      />
                    </div>
                  ),
                },
              ]}
            />
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

            <DataTable
              data={matches}
              keyExtractor={(m: any) => m._id}
              emptyMessage="No matches recorded for this team yet."
              columns={[
                {
                  header: 'Match',
                  width: '24%',
                  render: (m: any) => (
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
                  ),
                },
                {
                  header: 'Type / League',
                  width: '20%',
                  render: (m: any) =>
                    m.tournamentId ? (
                      <Link
                        href={`/tournaments/${m.tournamentId._id}`}
                        style={{
                          color: 'var(--accent-blue)',
                          textDecoration: 'none',
                          fontSize: '12px',
                        }}
                      >
                        {m.tournamentId.name}
                      </Link>
                    ) : (
                      <Badge variant="secondary">Friendly</Badge>
                    ),
                },
                {
                  header: 'Date',
                  width: '14%',
                  style: { fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (m: any) => new Date(m.matchDate).toLocaleDateString(),
                },
                {
                  header: 'Venue',
                  width: '14%',
                  style: { fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (m: any) => m.venue || '-',
                },
                {
                  header: 'Result',
                  width: '10%',
                  render: (m: any) => (
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
                  ),
                },
                {
                  header: 'Match Expense',
                  width: '10%',
                  style: { fontWeight: 600 },
                  render: (m: any) => `Rs. ${fNum(m.totalMatchExpense)}`,
                },
                {
                  header: 'Action',
                  width: '8%',
                  align: 'right',
                  render: (m: any) => (
                    <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                      <Button variant="secondary" size="sm">
                        View Details
                      </Button>
                    </Link>
                  ),
                },
              ]}
            />
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

            <DataTable
              data={tournaments}
              keyExtractor={(t: any) => t._id}
              emptyMessage="No tournaments linked to this team yet."
              columns={[
                {
                  header: 'Tournament',
                  width: '26%',
                  render: (t: any) => (
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
                      {t.name}
                      <ExternalLink size={10} color="var(--accent-blue)" />
                    </Link>
                  ),
                },
                {
                  header: 'Format',
                  width: '12%',
                  render: (t: any) => <Badge variant="purple">{t.format || 'Hard Ball'}</Badge>,
                },
                {
                  header: 'Venue',
                  width: '16%',
                  style: { fontSize: '12px', color: 'var(--text-secondary)' },
                  render: (t: any) => t.venue || '-',
                },
                {
                  header: 'Entry Fee',
                  width: '14%',
                  render: (t: any) => `Rs. ${fNum(t.entryFee)}`,
                },
                {
                  header: 'Prize Won',
                  width: '14%',
                  style: { fontWeight: 600, color: 'var(--accent-green)' },
                  render: (t: any) => `Rs. ${fNum(t.actualWinningPrizeWon)}`,
                },
                {
                  header: 'Status',
                  width: '10%',
                  render: (t: any) => (
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
                  ),
                },
                {
                  header: 'Action',
                  width: '8%',
                  align: 'right',
                  render: (t: any) => (
                    <Link href={`/tournaments/${t._id}`} passHref legacyBehavior>
                      <Button variant="secondary" size="sm">
                        View Tournament
                      </Button>
                    </Link>
                  ),
                },
              ]}
            />
          </Card>
        )}
      </div>

      {/* Edit Team Modal */}
      <EditTeamModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        team={team}
        onSuccess={invalidateTeam}
      />

      {/* Add / Manage Team Players Modal */}
      <ManageTeamPlayersModal
        isOpen={isAddPlayersOpen}
        onClose={() => setIsAddPlayersOpen(false)}
        team={team}
        existingSquadIds={players.map((p: any) => p._id)}
        onSuccess={invalidateTeam}
      />
    </>
  );
}
