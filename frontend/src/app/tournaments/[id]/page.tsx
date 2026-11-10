'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';

import { fetchApi } from '../../../lib/api';
import { formatDate, formatNumber } from '../../../lib/format';
import { confirmDelete, showToast } from '../../../lib/alerts';
import { Button, Badge, Input, Textarea, Modal, DataTable } from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditTournamentModal } from '../../../components/EditTournamentModal';
import { CreateMatchModal } from '../../../components/CreateMatchModal';
import { MatchExpenseModal } from '../../../components/MatchExpenseModal';
import { EditMomModal } from '../../../components/EditMomModal';
import { SquadFeesModal } from '../../../components/SquadFeesModal';
import { TournamentSponsorsSection } from '../../../components/TournamentSponsorsSection';
import { getTournamentStatusVariant } from '../../../constants/badgeVariants';
import { getTournamentExtraPaymentColumns, getTournamentMatchColumns } from '../../../columns/tournamentDetailColumns';
import { DetailNav } from '../../../components/DetailNav';

const statLabel: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};
const statSub: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' };

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
  const [activeTab, setActiveTab] = useState<'matches' | 'extra_payments' | 'sponsors'>('matches');
  const [isExtraPaymentOpen, setIsExtraPaymentOpen] = useState<boolean>(false);
  const [extraTitle, setExtraTitle] = useState<string>('');
  const [extraAmount, setExtraAmount] = useState<number | ''>('');
  const [extraDate, setExtraDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [isSavingExtra, setIsSavingExtra] = useState<boolean>(false);

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
    queryClient.invalidateQueries({ queryKey: ['expenses'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleAddExtraPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraAmount || Number(extraAmount) <= 0) {
      showToast.error('Please enter a valid payment amount.');
      return;
    }
    const teamIdVal = data?.tournament?.teamId?._id || data?.tournament?.teamId;
    if (!teamIdVal) {
      showToast.error('Tournament team not found.');
      return;
    }
    setIsSavingExtra(true);
    try {
      const res = await fetchApi<{ success: boolean }>('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          teamId: teamIdVal,
          tournamentId: id,
          category: 'tournament_entry_fee',
          title: extraTitle.trim() || 'Extra Tournament Payment',
          amount: Number(extraAmount),
          expenseDate: extraDate || new Date().toISOString(),
          description: extraNotes.trim() || undefined,
        }),
      });
      if (res.success) {
        showToast.success('Extra tournament payment recorded!');
        setExtraTitle('');
        setExtraAmount('');
        setExtraNotes('');
        setIsExtraPaymentOpen(false);
        invalidateData();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to record extra payment.');
    } finally {
      setIsSavingExtra(false);
    }
  };

  const handleDeleteExtraPayment = async (expenseId: string, title: string) => {
    const confirmed = await confirmDelete(`extra payment "${title}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/expenses/${expenseId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast.success('Extra payment removed.');
        invalidateData();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to delete extra payment.');
    }
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

  const entryFee = tournament.entryFee || 0;
  const advancePayment = tournament.advancePayment || 0;
  const totalExtraPayments = expenses.reduce(
    (sum: number, e: any) => sum + (e.amount || 0),
    0
  );
  // Total paid is Ground Cost + Advance Payment + Extra Payments
  const totalPaid = advancePayment + totalMatchExpenses + totalExtraPayments;
  const totalInvested = totalPaid;

  // Tournament-scoped sponsor money (funds received minus payouts back to sponsors)
  const sponsorFundsReceived =
    data.financials?.sponsorFundsReceived ??
    sponsors.reduce((sum: number, s: any) => sum + (s.amountInvested || 0), 0);
  const sponsorPayouts = data.financials?.sponsorPayouts ?? 0;
  const sponsorFunds = data.financials?.sponsorNet ?? sponsorFundsReceived - sponsorPayouts;
  const tournamentPrizeWon = tournament.actualWinningPrizeWon || 0;
  const matchMomPrizeWon = matches.reduce(
    (sum: number, m: any) => sum + (m.momPrizeMoney || 0) + (m.winningPrizeMoney || 0),
    0
  );
  const totalPrizeWon = tournamentPrizeWon + matchMomPrizeWon;

  // Still owed to the organizer: entry fee minus everything paid (advance + all ground/match
  // costs + extra payments) and prizes. Must match the tournaments list (tournamentController).
  const remainingEntryFeeBalance = Math.max(0, entryFee - totalPaid - totalPrizeWon);

  const totalReturns = totalPrizeWon + sponsorFunds + totalFeesCollected;
  const netRoi = totalReturns - totalPaid;

  return (
    <>
      <Header
        title={`${tournament.name} - Profile`}
        subtitle="Complete Tournament Ledger, Financial ROI, Matches & Dedicated Sponsors"
      />

      <div className="content-body">
        <DetailNav back={{ href: "/tournaments", label: "Back to All Tournaments" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExtraPaymentOpen(true)}
          >
            + Extra Payment
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Tournament
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </DetailNav>

        {/* Tournament summary: identity + ROI on top, five key figures below */}
        <div
          className="tournament-summary"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '16px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '16px',
              padding: '18px 22px',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Badge variant="secondary">{tournament.format || 'Hard Ball'}</Badge>
                <Badge variant={getTournamentStatusVariant(tournament.status)}>
                  {(tournament.status || 'ongoing').replace(/_/g, ' ')}
                </Badge>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {tournament.name}
              </h1>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {[tournament.venue, tournament.startDate ? formatDate(tournament.startDate) : null, tournament.teamId?.name]
                  .filter(Boolean)
                  .join('  ·  ')}
              </div>
              {tournament.notes && (
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{tournament.notes}</div>
              )}
            </div>

            <div className="tournament-roi" style={{ textAlign: 'right' }}>
              <div style={statLabel}>Net ROI</div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: netRoi > 0 ? '#15803d' : netRoi < 0 ? '#dc2626' : 'var(--text-primary)',
                  lineHeight: 1.2,
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                }}
              >
                {netRoi > 0 ? '+' : netRoi < 0 ? '−' : ''}Rs. {formatNumber(Math.abs(netRoi))}
              </div>
              <div style={statSub}>
                In Rs. {formatNumber(totalReturns)} · Out Rs. {formatNumber(totalPaid)}
              </div>
            </div>
          </div>

          <div
            className="tournament-summary-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              borderTop: '1px solid var(--border-color)',
              background: '#fcfcfd',
            }}
          >
            {[
              {
                label: 'Entry fee due',
                value: remainingEntryFeeBalance > 0 ? `Rs. ${formatNumber(remainingEntryFeeBalance)}` : 'Settled',
                color: remainingEntryFeeBalance > 0 ? '#dc2626' : '#15803d',
                sub: `of Rs. ${formatNumber(entryFee)} entry fee`,
              },
              {
                label: 'Squad fees collected',
                value: `Rs. ${formatNumber(totalFeesCollected)}`,
                sub: totalFeesPending > 0 ? `Rs. ${formatNumber(totalFeesPending)} still pending` : 'Nothing pending',
                subColor: totalFeesPending > 0 ? '#dc2626' : undefined,
              },
              {
                label: 'Total paid',
                value: `Rs. ${formatNumber(totalPaid)}`,
                sub: [
                  `Ground Rs. ${formatNumber(totalMatchExpenses)} · ${matches.length} match${matches.length === 1 ? '' : 'es'}`,
                  advancePayment > 0 ? `Advance Rs. ${formatNumber(advancePayment)}` : null,
                  totalExtraPayments > 0 ? `Extra Rs. ${formatNumber(totalExtraPayments)}` : null,
                ]
                  .filter(Boolean)
                  .join(' · '),
              },
              {
                label: 'Prizes won',
                value: `Rs. ${formatNumber(totalPrizeWon)}`,
                sub: `Winning Rs. ${formatNumber(tournamentPrizeWon)} · MOM Rs. ${formatNumber(matchMomPrizeWon)}`,
              },
              {
                label: 'Sponsors',
                value: `Rs. ${formatNumber(sponsorFundsReceived)}`,
                sub: `${sponsors.length} sponsor${sponsors.length === 1 ? '' : 's'} · Paid out Rs. ${formatNumber(sponsorPayouts)}`,
              },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: '14px 22px',
                  borderLeft: i === 0 ? 'none' : '1px solid var(--border-color)',
                  minWidth: 0,
                }}
              >
                <div style={statLabel}>{stat.label}</div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: stat.color || 'var(--text-primary)',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ ...statSub, color: stat.subColor || statSub.color }}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation: Matches vs Sponsors */}
        <div
          className="detail-tabs-row"
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
          <div className="detail-tabs" style={{ display: 'flex', gap: '8px' }}>
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
                border: activeTab === 'matches' ? '1px solid #475569' : '1px solid transparent',
                background: activeTab === 'matches' ? '#f8fafc' : '#ffffff',
                color: activeTab === 'matches' ? '#475569' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Tournament Matches ({matches.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('extra_payments')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: activeTab === 'extra_payments' ? '1px solid #475569' : '1px solid transparent',
                background: activeTab === 'extra_payments' ? '#f8fafc' : '#ffffff',
                color: activeTab === 'extra_payments' ? '#475569' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Extra Payments ({expenses.length})</span>
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
                border: activeTab === 'sponsors' ? '1px solid #94a3b8' : '1px solid transparent',
                background: activeTab === 'sponsors' ? '#f8fafc' : '#ffffff',
                color: activeTab === 'sponsors' ? '#64748b' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Dedicated Sponsors & Ledger ({sponsors.length})</span>
            </button>
          </div>

          <div>
            {activeTab === 'matches' && (
              <Button
                variant="primary"
                size="sm"
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
                columns={getTournamentMatchColumns({ handleOpenMatchExpense, handleOpenMatchFees })}
              />
            </div>
          </div>
        )}

        {/* TAB 2: EXTRA PAYMENTS */}
        {activeTab === 'extra_payments' && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Additional payments made for this tournament (outside per-match ground costs) • Total Extra Paid:{' '}
                <strong style={{ color: 'var(--accent-rose)' }}>Rs. {formatNumber(totalExtraPayments)}</strong>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsExtraPaymentOpen(true)}
              >
                + Add Extra Payment
              </Button>
            </div>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: '#ffffff' }}>
              <DataTable
                className="compact-table"
                data={expenses}
                keyExtractor={(e: any) => e._id}
                emptyMessage="No extra payments recorded for this tournament. Click '+ Add Extra Payment' to add one."
                columns={getTournamentExtraPaymentColumns({ handleDeleteExtraPayment })}
              />
            </div>
          </div>
        )}

        {/* TAB 3: SPONSORS & LEDGER */}
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

        {/* Modal: Add Extra Tournament Payment */}
        <Modal
          isOpen={isExtraPaymentOpen}
          onClose={() => setIsExtraPaymentOpen(false)}
          title={`Add Extra Payment — ${tournament.name}`}
          subtitle="Record additional tournament payment (organizer installment, ball/umpire fee, etc.)"
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => setIsExtraPaymentOpen(false)}
                disabled={isSavingExtra}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddExtraPayment}
                loading={isSavingExtra}
              >
                Save Extra Payment
              </Button>
            </>
          }
        >
          <form onSubmit={handleAddExtraPayment} className="form-stack">
            <Input
              label="Payment Title / Purpose *"
              placeholder="e.g. Organizer Extra Installment / Knock-out Fee"
              value={extraTitle}
              onChange={(e) => setExtraTitle(e.target.value)}
              required
            />
            <div className="grid-2">
              <Input
                label="Amount (Rs.) *"
                type="number"
                placeholder="5000"
                value={extraAmount}
                onWheel={(e) => e.currentTarget.blur()}
                onChange={(e) => setExtraAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
              />
              <Input
                label="Payment Date"
                type="date"
                value={extraDate}
                onChange={(e) => setExtraDate(e.target.value)}
              />
            </div>
            <Textarea
              label="Notes / Reference"
              rows={2}
              placeholder="Optional payment note or receipt reference..."
              value={extraNotes}
              onChange={(e) => setExtraNotes(e.target.value)}
            />
          </form>
        </Modal>

        {/* Unified 2-Column Squad Fees Ledger Modal */}
        <SquadFeesModal
          isOpen={isFeesModalOpen}
          onClose={() => setIsFeesModalOpen(false)}
          match={selectedMatchForFees}
          initialPayments={matchPayments}
          players={players}
          tournamentMatches={matches}
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
