'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';
import { StatCard } from '../../../components/StatCard';
import { fetchApi } from '../../../lib/api';
import { formatNumber } from '../../../lib/format';
import { confirmDelete, showToast } from '../../../lib/alerts';
import { Button, Badge, Modal, Card, DataTable } from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditTeamModal } from '../../../components/EditTeamModal';
import { ManageTeamPlayersModal } from '../../../components/ManageTeamPlayersModal';
import { EMPTY_VALUE } from '../../../constants';
import { getTeamTournamentColumns, getTeamMatchColumns, getTeamSquadColumns } from '../../../columns/teamDetailColumns';
import { DetailNav } from '../../../components/DetailNav';

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
        <DetailNav back={{ href: "/teams", label: "Back to All Teams" }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddPlayersOpen(true)}
          >
            Add Players to Team
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Team
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteTeam}
          >
            Delete
          </Button>
        </DetailNav>

        {/* Hero Card */}
        <Card className="detail-hero" style={{ marginBottom: '24px' }}>
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
                className="detail-avatar"
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '16px',
                  background: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)',
                  letterSpacing: '1px',
                }}
              >
                {team.shortName || team.name.slice(0, 3).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  {team.shortName && <Badge variant="purple">{team.shortName}</Badge>}
                  <Badge variant="primary">FRANCHISE</Badge>
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 700,
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
                    {team.city || EMPTY_VALUE}
                  </span>
                  {(team.phone || team.captain?.phone) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                </div>
              </div>
            </div>

            {/* Total Expenditures Outflow */}
            <div className="detail-hero-figure" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Match Expenses
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  color: 'var(--accent-blue)',
                }}
              >
                Rs. {formatNumber(stats.totalMatchExpenses)}
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
          />
          <StatCard
            variant="emerald"
            title="Matches Played"
            value={`${stats.totalMatches || matches.length} Matches`}
            subtitle={`${stats.matchesWon || 0} Victories Won`}
          />
          <StatCard
            variant="amber"
            title="Tournaments"
            value={`${tournaments.length} Seasons`}
            subtitle="Participated Leagues"
          />
          <StatCard
            variant="purple"
            title="Win Percentage"
            value={`${winRate}%`}
            subtitle={`${stats.matchesWon || 0}W / ${stats.matchesLost || 0}L`}
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
                Registered Squad Members ({players.length})
              </h3>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddPlayersOpen(true)}
              >
                Add Players
              </Button>
            </div>

            <DataTable
              data={players}
              keyExtractor={(p: any) => p._id}
              emptyMessage="No players assigned to this team roster yet. Click '+ Add Players' to build your squad."
              columns={getTeamSquadColumns({ handleRemovePlayerFromTeam })}
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
              Matches Played ({matches.length})
            </h3>

            <DataTable
              data={matches}
              keyExtractor={(m: any) => m._id}
              emptyMessage="No matches recorded for this team yet."
              columns={getTeamMatchColumns()}
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
              Tournaments Participated ({tournaments.length})
            </h3>

            <DataTable
              data={tournaments}
              keyExtractor={(t: any) => t._id}
              emptyMessage="No tournaments linked to this team yet."
              columns={getTeamTournamentColumns()}
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
