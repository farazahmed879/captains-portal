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
import { MatchExpenseModal } from '../../../components/MatchExpenseModal';
import { EditMomModal } from '../../../components/EditMomModal';
import { SquadFeesModal } from '../../../components/SquadFeesModal';
import { TournamentSponsorsSection } from '../../../components/TournamentSponsorsSection';
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
  Building2,
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
  const [selectedMatchForExpense, setSelectedMatchForExpense] = useState<any>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [selectedMatchForMom, setSelectedMatchForMom] = useState<any>(null);
  const [isMomModalOpen, setIsMomModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'sponsors'>('matches');

  const tournamentQuery = useQuery({
    queryKey: queryKeys.tournament(id),
    queryFn: () =>
      fetchApi<{
        success: boolean;
        tournament: any;
        matches: any[];
        expenses: any[];
        sponsors: any[];
        sponsorLedger?: any[];
        financials?: {
          totalFeesCollected?: number;
          totalFeesAssigned?: number;
          totalFeesPending?: number;
          sponsorFundsReceived?: number;
          sponsorPayouts?: number;
          sponsorNet?: number;
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

  const handleOpenMatchExpense = (m: any) => {
    setSelectedMatchForExpense(m);
    setIsExpenseModalOpen(true);
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

  const { tournament, matches = [], expenses = [], sponsors = [], sponsorLedger = [] } = data;

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
  // Tournament-scoped sponsor money (funds received minus payouts back to sponsors)
  const sponsorFundsReceived =
    data.financials?.sponsorFundsReceived ??
    sponsors.reduce((sum: number, s: any) => sum + (s.amountInvested || 0), 0);
  const sponsorPayouts = data.financials?.sponsorPayouts ?? 0;
  const sponsorFunds = data.financials?.sponsorNet ?? sponsorFundsReceived - sponsorPayouts;
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

        {/* Concise Hero Card */}
        <div
          style={{
            padding: '16px 20px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.05)',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Badge variant="purple" style={{ fontSize: '10.5px' }}>{tournament.format || 'Hard Ball'}</Badge>
                <Badge variant={getStatusBadgeVariant(tournament.status)} style={{ fontSize: '10.5px' }}>
                  {tournament.status.toUpperCase()}
                </Badge>
              </div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 6px 0',
                }}
              >
                {tournament.name}
              </h1>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  fontSize: '12.5px',
                  color: 'var(--text-secondary)',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPinIcon size={13} color="var(--accent-blue)" />
                  {tournament.venue || 'Karachi Grounds'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CalendarIcon size={13} />
                  {new Date(tournament.startDate).toLocaleDateString()}
                </span>
                <span>
                  Team: <strong style={{ color: 'var(--text-primary)' }}>{tournament.teamId?.name || 'Gulzar CC'}</strong>
                </span>
                {tournament.notes && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    • {tournament.notes}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                padding: '8px 14px',
                background: isProfitable ? '#f0fdf4' : '#fff1f2',
                borderRadius: '10px',
                border: isProfitable ? '1px solid #dcfce7' : '1px solid #ffe4e6',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, color: isProfitable ? '#166534' : '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Net Tournament ROI
              </div>
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: isProfitable ? '#15803d' : '#e11d48',
                  marginTop: '1px',
                }}
              >
                {isProfitable ? '+' : ''}Rs. {fNum(netRoi)}
              </div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: isProfitable ? '#166534' : '#9f1239' }}>
                {isProfitable ? 'Net Surplus Returned' : 'Operating Deficit'}
              </div>
            </div>
          </div>
        </div>

        {/* Compact 5-Metric Financial Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {/* Squad Fees */}
          <div style={{ padding: '10px 14px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Squad Fees Collected
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
              Rs. {fNum(totalFeesCollected)}
            </div>
            <div style={{ fontSize: '11px', color: '#166534', marginTop: '2px' }}>
              Due: <strong>Rs. {fNum(totalFeesPending)}</strong> · Assig: Rs. {fNum(totalFeesAssigned)}
            </div>
          </div>

          {/* Entry Fee */}
          <div style={{ padding: '10px 14px', background: '#fff1f2', border: '1px solid #ffe4e6', borderRadius: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#9f1239', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Entry Fee Invested
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#e11d48', marginTop: '2px' }}>
              Rs. {fNum(tournament.entryFee)}
            </div>
            <div style={{ fontSize: '11px', color: '#9f1239', marginTop: '2px' }}>
              Paid to organizer
            </div>
          </div>

          {/* Match Costs */}
          <div style={{ padding: '10px 14px', background: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Match Ground Costs
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
              Rs. {fNum(totalMatchExpenses)}
            </div>
            <div style={{ fontSize: '11px', color: '#1e40af', marginTop: '2px' }}>
              {matches.length} {matches.length === 1 ? 'Match' : 'Matches'} Ground & Ref
            </div>
          </div>

          {/* Prize Money */}
          <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Prize Money Won
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#d97706', marginTop: '2px' }}>
              Rs. {fNum(totalPrizeWon)}
            </div>
            <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
              Expected: Rs. {fNum(tournament.expectedWinningPrize)}
            </div>
          </div>

          {/* Dedicated Sponsors */}
          <div style={{ padding: '10px 14px', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: '10px' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#5b21b6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Dedicated Sponsors
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#7c3aed', marginTop: '2px' }}>
              Rs. {fNum(sponsorFundsReceived)}
            </div>
            <div style={{ fontSize: '11px', color: '#5b21b6', marginTop: '2px' }}>
              {sponsors.length} Sponsors · Paid out: Rs. {fNum(sponsorPayouts)}
            </div>
          </div>
        </div>

        {/* Tab Navigation: Matches vs Sponsors */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            borderBottom: '1.5px solid var(--border-color)',
            paddingBottom: '10px',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('matches')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: activeTab === 'matches' ? '1px solid #0284c7' : '1px solid transparent',
                background: activeTab === 'matches' ? '#eff6ff' : '#ffffff',
                color: activeTab === 'matches' ? '#0284c7' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <SwordsIcon size={15} />
              <span>Tournament Matches ({matches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sponsors')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: activeTab === 'sponsors' ? '1px solid #8b5cf6' : '1px solid transparent',
                background: activeTab === 'sponsors' ? '#f5f3ff' : '#ffffff',
                color: activeTab === 'sponsors' ? '#7c3aed' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Building2 size={15} />
              <span>Dedicated Sponsors & Ledger ({sponsors.length})</span>
            </button>
          </div>

          <div>
            {activeTab === 'matches' && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={() => setIsCreateMatchOpen(true)}
              >
                Schedule Match
              </Button>
            )}
          </div>
        </div>

        {/* TAB 1: MATCHES */}
        {activeTab === 'matches' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ maxHeight: '440px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', background: '#ffffff' }}>
              <DataTable
                className="compact-table"
                data={matches}
                keyExtractor={(m: any) => m._id}
                emptyMessage="No matches recorded yet for this tournament. Click '+ Add Match to Tournament' to schedule one."
                columns={[
                  {
                    header: 'Team vs Team',
                    width: '24%',
                    render: (m: any) => {
                      const clubName = m.teamId?.name || tournament?.teamId?.name || 'Our Team';
                      return (
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                            <span>{clubName}</span>
                            <span style={{ fontSize: '9.5px', fontWeight: 800, padding: '1px 4px', borderRadius: '4px', background: '#eff6ff', color: '#0284c7' }}>VS</span>
                            <span style={{ color: 'var(--accent-blue)' }}>{m.opponentTeam || 'Opponent'}</span>
                          </div>
                          <Badge variant="purple" style={{ fontSize: '9.5px', padding: '1px 5px', marginTop: '2px' }}>
                            {m.tournamentStage || m.stage || 'group'}
                          </Badge>
                        </div>
                      );
                    },
                  },
                  {
                    header: 'Date & Venue',
                    width: '16%',
                    render: (m: any) => (
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--accent-blue)' }}>{m.venue}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {new Date(m.matchDate).toLocaleDateString()}
                        </div>
                      </div>
                    ),
                  },
                  {
                    header: 'Ground Cost',
                    width: '12%',
                    style: { fontWeight: 700, fontSize: '12.5px', color: 'var(--accent-rose)' },
                    render: (m: any) => `Rs. ${fNum(m.totalMatchExpense)}`,
                  },
                  {
                    header: 'Squad Fees',
                    width: '16%',
                    render: (m: any) => {
                      const collected = m.totalCollected || 0;
                      const assigned = m.totalAssigned || 0;
                      const pending = m.pendingFee || Math.max(0, assigned - collected);
                      return (
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '12.5px' }}>
                            Rs. {fNum(collected)}
                            {assigned > 0 && (
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: 'var(--text-muted)',
                                  fontWeight: 500,
                                  marginLeft: '4px',
                                }}
                              >
                                / Rs. {fNum(assigned)}
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: '1px' }}>
                            {assigned === 0 ? (
                              <Badge variant="secondary" style={{ fontSize: '9.5px', padding: '1px 4px' }}>
                                No Fees Set
                              </Badge>
                            ) : pending > 0 ? (
                              <Badge variant="warning" style={{ fontSize: '9.5px', padding: '1px 4px' }}>
                                Rs. {fNum(pending)} Due
                              </Badge>
                            ) : (
                              <Badge variant="success" style={{ fontSize: '9.5px', padding: '1px 4px' }}>
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
                    width: '10%',
                    render: (m: any) => (
                      <Badge variant={getResultBadgeVariant(m.result)} style={{ fontSize: '10px', padding: '2px 6px' }}>
                        {m.result?.toUpperCase()}
                      </Badge>
                    ),
                  },
                  {
                    header: 'Actions',
                    width: '22%',
                    align: 'right',
                    render: (m: any) => {
                      const pending = m.pendingFee || Math.max(0, (m.totalAssigned || 0) - (m.totalCollected || 0));
                      return (
                        <div className="action-group" style={{ justifyContent: 'flex-end', gap: '5px' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<ReceiptIcon size={11} color="var(--accent-rose)" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMatchExpense(m);
                            }}
                            title="Record / Edit Match & Ground Fee Paid to Organizer"
                            style={{ height: '28px', padding: '0 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                          >
                            <span>Match Fee</span>
                          </Button>
                          <Button
                            variant={pending > 0 ? 'primary' : 'secondary'}
                            size="sm"
                            icon={<UsersIcon size={11} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenMatchFees(m);
                            }}
                            title="Manage player fee collection, record payments & clear dues"
                            style={{ height: '28px', padding: '0 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
                          >
                            <span>Player Fee</span>
                          </Button>
                          <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                            <Button
                              variant="secondary"
                              size="sm"
                              iconRight={<ExternalLinkIcon size={11} />}
                              style={{ height: '28px', padding: '0 8px', fontSize: '11.5px' }}
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
          </div>
        )}

        {/* TAB 2: SPONSORS & LEDGER */}
        {activeTab === 'sponsors' && (
          <TournamentSponsorsSection
            tournament={tournament}
            sponsors={sponsors}
            ledger={sponsorLedger}
            teams={teams}
            onChanged={() => {
              invalidateData();
              queryClient.invalidateQueries({ queryKey: queryKeys.sponsors() });
            }}
          />
        )}

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

        {/* Modal: Match Fee & Ground Expenses Paid to Organizer */}
        <MatchExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => {
            setIsExpenseModalOpen(false);
            setSelectedMatchForExpense(null);
          }}
          match={selectedMatchForExpense}
          onSuccess={invalidateData}
        />

        {/* Modal: Edit Man of the Match & Organizer Cash Prize */}
        <EditMomModal
          isOpen={isMomModalOpen}
          onClose={() => {
            setIsMomModalOpen(false);
            setSelectedMatchForMom(null);
          }}
          match={selectedMatchForMom}
          players={players}
          onSuccess={() => {
            invalidateData();
            if (selectedMatchForFees) {
              handleOpenMatchFees({ _id: selectedMatchForFees._id });
            }
          }}
        />

        {/* Unified 2-Column Squad Fees Ledger Modal */}
        <SquadFeesModal
          isOpen={isFeesModalOpen}
          onClose={() => setIsFeesModalOpen(false)}
          match={selectedMatchForFees}
          initialPayments={matchPayments}
          players={players}
          onSuccess={() => {
            invalidateData();
            if (selectedMatchForFees) {
              handleOpenMatchFees({ _id: selectedMatchForFees._id });
            }
          }}
        />
      </div>
    </>
  );
}
