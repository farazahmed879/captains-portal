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
  Select,
  Textarea,
  Modal,
  Card,
  DataTable,
} from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditTournamentModal } from '../../../components/EditTournamentModal';
import { CreateMatchModal } from '../../../components/CreateMatchModal';
import { AssignSquadFeeForm } from '../../../components/AssignSquadFeeForm';
import {
  Plus,
  TrophyIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowLeftIcon,
  DollarIcon,
  SwordsIcon,
  ReceiptIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  ExternalLinkIcon,
  CheckCircle2,
} from '../../../components/icons';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [isCreateMatchOpen, setIsCreateMatchOpen] = useState<boolean>(false);
  const [selectedMatchForFees, setSelectedMatchForFees] = useState<any>(null);
  const [matchPayments, setMatchPayments] = useState<any[]>([]);
  const [showAddPlayerPayment, setShowAddPlayerPayment] = useState<boolean>(false);
  const [isFeesModalOpen, setIsFeesModalOpen] = useState<boolean>(false);

  const tournamentQuery = useQuery({
    queryKey: queryKeys.tournament(id),
    queryFn: () =>
      fetchApi<{
        success: boolean;
        tournament: any;
        matches: any[];
        expenses: any[];
        sponsors: any[];
        financials?: {
          totalFeesCollected?: number;
          totalFeesAssigned?: number;
          totalFeesPending?: number;
        };
      }>(`/tournaments/${id}`),
    enabled: !!id,
  });

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
  });

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
  });

  const data = tournamentQuery.data;
  const loading = tournamentQuery.isLoading;
  const teams = teamsQuery.data?.teams || [];
  const players = playersQuery.data?.players || [];

  const handleOpenMatchFees = (m: any) => {
    setSelectedMatchForFees(m);
    setShowAddPlayerPayment(false);
    fetchApi<{ success: boolean; match: any; payments: any[] }>(`/matches/${m._id}`)
      .then((res) => {
        if (res.success) {
          setSelectedMatchForFees(res.match);
          setMatchPayments(res.payments || []);
          setIsFeesModalOpen(true);
        }
      })
      .catch(() => {
        setMatchPayments(m.payments || []);
        setIsFeesModalOpen(true);
      });
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
        if (selectedMatchForFees?._id === matchId) {
          handleOpenMatchFees({ _id: matchId });
        }
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to mark squad fees as paid.');
    }
  };

  const handleQuickMarkPaymentPaid = async (paymentId: string, feeAssigned: number) => {
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: feeAssigned,
          paymentStatus: 'paid',
          paymentDate: new Date().toISOString(),
          paymentMethod: 'cash',
        }),
      });
      if (res.success) {
        showToast.success('Player payment marked as paid!');
        invalidateData();
        if (selectedMatchForFees?._id) {
          handleOpenMatchFees({ _id: selectedMatchForFees._id });
        }
      }
    } catch (err) {
      showToast.error('Failed to update payment.');
    }
  };

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleDelete = async () => {
    const confirmed = await confirmDelete(`tournament "${data?.tournament?.name}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Tournament "${data?.tournament?.name}" deleted.`);
        router.push('/tournaments');
      }
    } catch (err) {
      showToast.error('Failed to delete tournament.');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

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

  if (loading) {
    return (
      <div>
        <Header title="Tournament Profile" subtitle="League matches, prize ROI, and squad expenditures" />
        <div className="content-body"><DetailPageSkeleton /></div>
      </div>
    );
  }

  if (!data?.tournament) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Tournament not found. <Link href="/tournaments">Back to Tournaments</Link>
      </div>
    );
  }

  const { tournament, matches = [], expenses = [], sponsors = [] } = data;

  const totalFeesCollected =
    data.financials?.totalFeesCollected ??
    matches.reduce((sum: number, m: any) => sum + (m.totalCollected || 0), 0);
  const totalFeesAssigned =
    data.financials?.totalFeesAssigned ??
    matches.reduce((sum: number, m: any) => sum + (m.totalAssigned || 0), 0);
  const totalFeesPending =
    data.financials?.totalFeesPending ??
    Math.max(0, totalFeesAssigned - totalFeesCollected);

  const totalMatchExpenses = matches.reduce(
    (sum: number, m: any) => sum + (m.totalMatchExpense || 0),
    0
  );
  const totalInvested = (tournament.entryFee || 0) + totalMatchExpenses;
  const sponsorFunds = sponsors.reduce(
    (sum: number, s: any) => sum + (s.amountInvested || 0),
    0
  );
  const totalPrizeWon = tournament.actualWinningPrizeWon || 0;
  const totalReturns = totalPrizeWon + sponsorFunds + totalFeesCollected;
  const netRoi = totalReturns - totalInvested;
  const isProfitable = netRoi >= 0;

  return (
    <>
      <Header
        title={`${tournament.name} - Profile`}
        subtitle="Complete Tournament Ledger, Financial ROI, Matches & Dedicated Sponsors"
      />

      <div className="content-body">
        {/* Back Navigation Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <Link href="/tournaments" passHref legacyBehavior>
            <Button variant="secondary" size="sm" icon={<ArrowLeftIcon size={14} />}>
              Back to All Tournaments
            </Button>
          </Link>

          <div className="action-group">
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsCreateMatchOpen(true)}
            >
              Schedule Match
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<PencilIcon size={13} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Tournament
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<TrashIcon size={13} />}
              onClick={handleDelete}
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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Badge variant="purple">{tournament.format || 'Hard Ball'}</Badge>
                <Badge variant={getStatusBadgeVariant(tournament.status)}>
                  {tournament.status.toUpperCase()}
                </Badge>
              </div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {tournament.name}
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
                  <MapPinIcon size={14} color="var(--accent-blue)" />
                  {tournament.venue || 'Karachi Grounds'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon size={14} />
                  {new Date(tournament.startDate).toLocaleDateString()}
                </span>
                <span>
                  Team: <strong style={{ color: 'var(--text-primary)' }}>{tournament.teamId?.name || 'Gulzar CC'}</strong>
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Net Tournament ROI
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: isProfitable ? 'var(--accent-green)' : 'var(--accent-rose)',
                }}
              >
                {isProfitable ? '+' : ''}Rs. {fNum(netRoi)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isProfitable ? 'Net Surplus Returned' : 'Operating Deficit'}
              </div>
            </div>
          </div>

          {tournament.notes && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
              }}
            >
              {tournament.notes}
            </div>
          )}
        </Card>

        {/* Financial Metric Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <StatCard
            variant="emerald"
            title="Squad Fees Collected"
            value={`Rs. ${fNum(totalFeesCollected)}`}
            subtitle={`Assigned: Rs. ${fNum(totalFeesAssigned)} · Due: Rs. ${fNum(totalFeesPending)}`}
            icon={<DollarIcon size={20} color="var(--accent-green)" />}
          />
          <StatCard
            variant="rose"
            title="Entry Fee Invested"
            value={`Rs. ${fNum(tournament.entryFee)}`}
            subtitle="Registration cost paid to organizers"
            icon={<ReceiptIcon size={20} color="var(--accent-rose)" />}
          />
          <StatCard
            variant="blue"
            title="Match Ground Costs"
            value={`Rs. ${fNum(totalMatchExpenses)}`}
            subtitle={`${matches.length} Matches Ground & Ref Fees`}
            icon={<DollarIcon size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="amber"
            title="Prize Money Won"
            value={`Rs. ${fNum(totalPrizeWon)}`}
            subtitle={`Payable: Rs. ${fNum(tournament.expectedWinningPrize)}`}
            icon={<TrophyIcon size={20} color="var(--accent-amber)" />}
          />
          <StatCard
            variant="purple"
            title="Dedicated Sponsors"
            value={`Rs. ${fNum(sponsorFunds)}`}
            subtitle={`${sponsors.length} Brand Partners Tagged`}
            icon={<UsersIcon size={20} color="#8b5cf6" />}
          />
        </div>

        {/* Matches Section */}
        <div style={{ marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SwordsIcon size={18} color="var(--accent-blue)" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Tournament Matches ({matches.length})
              </h2>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setIsCreateMatchOpen(true)}
            >
              Add Match to Tournament
            </Button>
          </div>

          <DataTable
            data={matches}
            keyExtractor={(m: any) => m._id}
            emptyMessage="No matches recorded yet for this tournament. Click '+ Add Match to Tournament' to schedule one."
            columns={[
              {
                header: 'Team vs Team',
                width: '26%',
                render: (m: any) => {
                  const clubName = m.teamId?.name || tournament?.teamId?.name || 'Our Team';
                  return (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                        <span>{clubName}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: '#eff6ff', color: '#0284c7' }}>VS</span>
                        <span style={{ color: 'var(--accent-blue)' }}>{m.opponentTeam || 'Opponent'}</span>
                      </div>
                      <Badge variant="purple" style={{ fontSize: '10px', marginTop: '3px' }}>
                        {m.tournamentStage || m.stage || 'group'}
                      </Badge>
                    </div>
                  );
                },
              },
              {
                header: 'Date & Venue',
                width: '18%',
                render: (m: any) => (
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{m.venue}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(m.matchDate).toLocaleDateString()}
                    </div>
                  </div>
                ),
              },
              {
                header: 'Ground Cost',
                width: '13%',
                style: { fontWeight: 700, color: 'var(--accent-rose)' },
                render: (m: any) => `Rs. ${fNum(m.totalMatchExpense)}`,
              },
              {
                header: 'Squad Fees',
                width: '18%',
                render: (m: any) => {
                  const collected = m.totalCollected || 0;
                  const assigned = m.totalAssigned || 0;
                  const pending = m.pendingFee || Math.max(0, assigned - collected);
                  return (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '13px' }}>
                        Rs. {fNum(collected)}
                        {assigned > 0 && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: 'var(--text-muted)',
                              fontWeight: 500,
                              marginLeft: '4px',
                            }}
                          >
                            / Rs. {fNum(assigned)}
                          </span>
                        )}
                      </div>
                      <div style={{ marginTop: '2px' }}>
                        {assigned === 0 ? (
                          <Badge variant="secondary" style={{ fontSize: '10px', padding: '1px 5px' }}>
                            No Fees Set
                          </Badge>
                        ) : pending > 0 ? (
                          <Badge variant="warning" style={{ fontSize: '10px', padding: '1px 5px' }}>
                            Rs. {fNum(pending)} Due
                          </Badge>
                        ) : (
                          <Badge variant="success" style={{ fontSize: '10px', padding: '1px 5px' }}>
                            Cleared
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                },
              },
              {
                header: 'Result / Score',
                width: '11%',
                render: (m: any) => (
                  <Badge variant={getResultBadgeVariant(m.result)}>
                    {m.result?.toUpperCase()}
                  </Badge>
                ),
              },
              {
                header: 'Actions',
                width: '16%',
                align: 'right',
                render: (m: any) => {
                  const pending = m.pendingFee || Math.max(0, (m.totalAssigned || 0) - (m.totalCollected || 0));
                  return (
                    <div className="action-group" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                      <Button
                        variant={pending > 0 ? 'primary' : 'secondary'}
                        size="sm"
                        icon={<DollarIcon size={12} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMatchFees(m);
                        }}
                        title="Manage / Collect Match Fees"
                      >
                        <span>{pending > 0 ? 'Pay Fee' : 'Fees'}</span>
                      </Button>
                      <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconRight={<ExternalLinkIcon size={12} />}
                        >
                          Profile
                        </Button>
                      </Link>
                    </div>
                  );
                },
              },
            ]}
          />
        </div>

        {/* Modal: Create Match Associated with this Tournament */}
        <CreateMatchModal
          isOpen={isCreateMatchOpen}
          onClose={() => setIsCreateMatchOpen(false)}
          teams={teams}
          tournaments={[tournament]}
          defaultTournamentId={tournament._id}
          defaultTeamId={tournament.teamId?._id || tournament.teamId}
          lockTournament
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Tournament */}
        <EditTournamentModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          tournament={data?.tournament}
          onSuccess={invalidateData}
        />

        {/* Modal: Match Squad Fees Drawer */}
        <Modal
          isOpen={isFeesModalOpen}
          maxWidth="920px"
          onClose={() => {
            setIsFeesModalOpen(false);
            setShowAddPlayerPayment(false);
          }}
          title={
            selectedMatchForFees
              ? `Squad Fees — ${selectedMatchForFees.opponentTeam ? `vs ${selectedMatchForFees.opponentTeam}` : selectedMatchForFees.venue}`
              : 'Match Squad Fees'
          }
          subtitle="Manage player fee collection, record payments & clear dues"
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                setIsFeesModalOpen(false);
                setShowAddPlayerPayment(false);
              }}
            >
              Close
            </Button>
          }
        >
          {selectedMatchForFees && (() => {
            const totalCost = selectedMatchForFees.totalMatchExpense || 0;
            const totalCollected = matchPayments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
            const totalAssigned = matchPayments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
            const remaining = totalCost > totalCollected ? totalCost - totalCollected : 0;
            const pendingDues = Math.max(0, totalAssigned - totalCollected);

            return (
              <div>
                {/* Modern Stat Cards Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#fff1f2',
                      border: '1px solid #ffe4e6',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Ground Cost
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#e11d48', marginTop: '2px' }}>
                      Rs. {fNum(totalCost)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#f0fdf4',
                      border: '1px solid #dcfce7',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Fees Collected
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>
                      Rs. {fNum(totalCollected)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Pending Dues
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
                      Rs. {fNum(pendingDues)}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '12px 14px',
                      background: remaining === 0 ? '#f0fdf4' : '#fff7ed',
                      border: remaining === 0 ? '1px solid #dcfce7' : '1px solid #ffedd5',
                      borderRadius: '10px',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: remaining === 0 ? '#166534' : '#9a3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Net Balance
                    </div>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 800,
                        color: remaining === 0 ? '#16a34a' : '#ea580c',
                        marginTop: '2px',
                      }}
                    >
                      {remaining === 0 ? 'Recovered' : `Rs. ${fNum(remaining)} Deficit`}
                    </div>
                  </div>
                </div>

                {/* Actions Bar */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Squad Players ({matchPayments.length})
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {pendingDues > 0 && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle2 size={13} />}
                        onClick={() => handleMarkAllPaid(selectedMatchForFees._id)}
                        title="Mark all pending squad match fees as paid"
                      >
                        <span>Mark All Match Fees Paid</span>
                      </Button>
                    )}
                    <Button
                      variant={showAddPlayerPayment ? 'secondary' : 'primary'}
                      size="sm"
                      icon={<Plus size={13} />}
                      onClick={() => setShowAddPlayerPayment(!showAddPlayerPayment)}
                    >
                      {showAddPlayerPayment ? 'Cancel' : '+ Add Player Fee'}
                    </Button>
                  </div>
                </div>

                {/* Inline Add Player Fee Form */}
                {showAddPlayerPayment && (
                  <AssignSquadFeeForm
                    matchId={selectedMatchForFees._id}
                    defaultFee={selectedMatchForFees.perPlayerFee || 1000}
                    players={players}
                    excludePlayerIds={matchPayments.map((p: any) => p.playerId?._id || p.playerId).filter(Boolean)}
                    onSuccess={() => {
                      setShowAddPlayerPayment(false);
                      invalidateData();
                      handleOpenMatchFees({ _id: selectedMatchForFees._id });
                    }}
                    onCancel={() => setShowAddPlayerPayment(false)}
                  />
                )}

                {/* Payments Table */}
                <DataTable<any>
                  data={matchPayments}
                  keyExtractor={(p) => p._id}
                  emptyMessage="No squad player fees recorded for this match yet."
                  columns={[
                    {
                      header: 'Player',
                      render: (p) => (
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.playerId?.name || 'Unknown Player'}
                          {p.playerId?.jerseyNumber ? ` (#${p.playerId.jerseyNumber})` : ''}
                        </span>
                      ),
                    },
                    {
                      header: 'Fee Assigned',
                      render: (p) => `Rs. ${fNum(p.feeAssigned)}`,
                    },
                    {
                      header: 'Fee Paid',
                      render: (p) => (
                        <strong style={{ color: p.feePaid >= p.feeAssigned ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                          Rs. {fNum(p.feePaid)}
                        </strong>
                      ),
                    },
                    {
                      header: 'Status',
                      render: (p) => {
                        const isPaid = p.paymentStatus === 'paid';
                        return (
                          <Badge variant={isPaid ? 'success' : p.paymentStatus === 'partial' ? 'warning' : 'danger'}>
                            {p.paymentStatus?.toUpperCase()}
                          </Badge>
                        );
                      },
                    },
                    {
                      header: 'Action',
                      align: 'right',
                      render: (p) => {
                        const isPaid = p.paymentStatus === 'paid';
                        if (isPaid) return <span style={{ fontSize: '11px', color: 'var(--accent-green)', fontWeight: 600 }}>Paid</span>;
                        return (
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckCircle2 size={12} />}
                            onClick={() => handleQuickMarkPaymentPaid(p._id, p.feeAssigned)}
                          >
                            Mark Paid
                          </Button>
                        );
                      },
                    },
                  ]}
                />
              </div>
            );
          })()}
        </Modal>
      </div>
    </>
  );
}
