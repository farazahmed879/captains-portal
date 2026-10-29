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
  DatePicker,
  Modal,
  Card,
  DataTable,

} from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditMatchModal } from '../../../components/EditMatchModal';
import { EditPaymentModal } from '../../../components/EditPaymentModal';
import { AssignSquadFeeForm } from '../../../components/AssignSquadFeeForm';
import {
  Calendar,
  MapPin,
  ArrowLeft,
  DollarSign,
  Receipt,
  Users,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  ExternalLink,
} from '../../../components/icons';

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [showAddPlayerPayment, setShowAddPlayerPayment] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);

  // React Queries
  const matchQuery = useQuery({
    queryKey: queryKeys.match(id),
    queryFn: () => fetchApi<{ success: boolean; match: any; payments: any[] }>(`/matches/${id}`),
    enabled: !!id,
  });

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
  });

  const matchData = matchQuery.data?.match;
  const payments = matchQuery.data?.payments || [];
  const players = playersQuery.data?.players || [];
  const loading = matchQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.match(id) });
    queryClient.invalidateQueries({ queryKey: ['matches'] });
    queryClient.invalidateQueries({ queryKey: ['players'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const handleDeleteMatch = async () => {
    const confirmed = await confirmDelete(`match vs "${matchData?.opponentTeam}"`);
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' });
      if (res.success) {
        showToast.success(`Match vs "${matchData?.opponentTeam}" deleted.`);
        router.push('/matches');
      }
    } catch (err) {
      showToast.error('Failed to delete match.');
    }
  };

  const handleQuickMarkPaid = async (payment: any) => {
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${payment._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: payment.feeAssigned,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString(),
        }),
      });
      if (res.success) {
        showToast.success('Player payment marked as paid!');
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to update payment.');
    }
  };

  const handleMarkAllPaid = async () => {
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>(
        `/payments/matches/${id}/mark-all-paid`,
        { method: 'PUT' }
      );
      if (res.success) {
        showToast.success('All squad match fees marked as paid!');
        invalidateData();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to update payments.');
    }
  };

  const handleDeletePayment = async (paymentId: string, playerName?: string) => {
    const confirmed = await confirmDelete(playerName ? `squad payment for "${playerName}"` : 'player payment record from match');
    if (!confirmed) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        showToast.success('Player payment removed from match.');
        invalidateData();
      }
    } catch (err) {
      showToast.error('Failed to remove player payment.');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

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
        <Header title="Match Details" subtitle="Match scorecard, itemized ground expenses & squad collection ledger" />
        <div className="content-body"><DetailPageSkeleton /></div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Match not found. <Link href="/matches">Back to Matches</Link>
      </div>
    );
  }

  const totalCollected = payments.reduce((acc, p) => acc + (p.feePaid || 0), 0);
  const totalAssigned = payments.reduce((acc, p) => acc + (p.feeAssigned || 0), 0);
  const totalPending = totalAssigned - totalCollected;
  const matchExpenses = matchData.totalMatchExpense || 0;
  const netMatchBalance = totalCollected - matchExpenses;
  const isSurplus = netMatchBalance >= 0;

  const paidCount = payments.filter((p) => p.paymentStatus === 'paid').length;
  const pendingCount = payments.filter((p) => p.paymentStatus !== 'paid').length;

  return (
    <>
      <Header
        title={`Match vs ${matchData.opponentTeam}`}
        subtitle="Match scorecard, itemized ground expenses & squad collection ledger"
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
          <Link href="/matches" passHref legacyBehavior>
            <Button variant="secondary" size="sm" icon={<ArrowLeft size={14} />}>
              Back to All Matches
            </Button>
          </Link>

          <div className="action-group">
            {totalPending > 0 && (
              <Button
                variant="success"
                size="sm"
                icon={<CheckCircle2 size={13} />}
                onClick={handleMarkAllPaid}
                title="Mark all pending squad match fees as paid"
              >
                Match Fee Paid
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Pencil size={13} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Match
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={13} />}
              onClick={handleDeleteMatch}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Badge variant={matchData.matchType === 'tournament' ? 'primary' : 'purple'}>
                  {matchData.matchType === 'tournament' ? 'TOURNAMENT MATCH' : 'FRIENDLY MATCH'}
                </Badge>

                {matchData.tournamentId && (
                  <Link
                    href={`/tournaments/${matchData.tournamentId._id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Badge variant="purple" icon={<ExternalLink size={10} />}>
                      {matchData.tournamentId.name}
                    </Badge>
                  </Link>
                )}

                {matchData.tournamentStage && (
                  <Badge variant="secondary">{matchData.tournamentStage}</Badge>
                )}

                <Badge variant={getResultBadgeVariant(matchData.result)}>
                  {matchData.result ? matchData.result.toUpperCase() : 'PENDING'}
                </Badge>
              </div>

              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                }}
              >
                {matchData.teamId?.name || 'Gulzar Cricket Team'}{' '}
                <span style={{ color: 'var(--accent-blue)', fontSize: '20px' }}>VS</span>{' '}
                {matchData.opponentTeam}
              </h1>

              {/* Scorecard strip */}
              {(matchData.ourScore || matchData.opponentScore) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    padding: '8px 14px',
                    background: '#f8fafc',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    width: 'fit-content',
                    marginBottom: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OUR SCORE: </span>
                    <strong style={{ fontSize: '15px', color: 'var(--accent-blue)' }}>
                      {matchData.ourScore || 'N/A'}
                    </strong>
                  </div>
                  <div style={{ color: 'var(--border-color)' }}>|</div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>OPPONENT: </span>
                    <strong style={{ fontSize: '15px', color: 'var(--accent-rose)' }}>
                      {matchData.opponentScore || 'N/A'}
                    </strong>
                  </div>
                </div>
              )}

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
                  {matchData.venue || 'Standard Ground'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} />
                  {new Date(matchData.matchDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} />
                  {matchData.overs} Overs Match
                </span>
              </div>
            </div>

            {/* Match Net Financial KPI */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Net Match Cash Flow
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: isSurplus ? 'var(--accent-green)' : 'var(--accent-rose)',
                }}
              >
                {isSurplus ? '+' : ''}Rs. {fNum(netMatchBalance)}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isSurplus ? 'Match Surplus (Collected > Expense)' : 'Operating Deficit (Expense > Collected)'}
              </div>
            </div>
          </div>

          {/* Man of the match banner */}
          {matchData.momPlayerId && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 16px',
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Award size={18} color="#d97706" />
              <span style={{ fontSize: '13px', color: '#92400e' }}>
                <strong>Man of the Match:</strong>{' '}
                <Link
                  href={`/players/${matchData.momPlayerId._id}`}
                  style={{ color: '#b45309', fontWeight: 700, textDecoration: 'underline' }}
                >
                  {matchData.momPlayerId.name}
                </Link>{' '}
                ({matchData.momPlayerId.role?.replace('_', ' ') || 'Player'})
              </span>
            </div>
          )}

          {matchData.notes && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
            >
              {matchData.notes}
            </div>
          )}
        </Card>

        {/* 4 KPI Summary Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard
            variant="rose"
            title="Total Ground Cost"
            value={`Rs. ${fNum(matchExpenses)}`}
            subtitle="Pitch, balls, umpires, water"
            icon={<Receipt size={20} color="var(--accent-rose)" />}
          />
          <StatCard
            variant="emerald"
            title="Squad Fees Collected"
            value={`Rs. ${fNum(totalCollected)}`}
            subtitle={`${paidCount} players cleared`}
            icon={<DollarSign size={20} color="var(--accent-green)" />}
          />
          <StatCard
            variant="amber"
            title="Squad Fees Pending"
            value={`Rs. ${fNum(totalPending)}`}
            subtitle={`${pendingCount} players pending`}
            icon={<AlertCircle size={20} color="var(--accent-amber)" />}
          />
          <StatCard
            variant="blue"
            title="Squad Size"
            value={`${payments.length} Players`}
            subtitle={`Rs. ${fNum(matchData.perPlayerFee)} / player fee`}
            icon={<Users size={20} color="var(--accent-blue)" />}
          />
        </div>

        {/* 2-Columns: Ground Cost Breakdown & Squad Ledger */}
        <div className="r-split" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Ground Cost Itemized Breakdown */}
          <Card>
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 700,
                marginBottom: '16px',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Receipt size={16} color="var(--accent-blue)" />
              Itemized Ground Expenses
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Pitch / Ground Rent</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rs. {fNum(matchData.groundCost)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Umpire Charges</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rs. {fNum(matchData.umpireCost)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Match Balls</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rs. {fNum(matchData.ballCost)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Refreshments & Water</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rs. {fNum(matchData.refreshmentCost)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Other Miscellaneous</span>
                <strong style={{ color: 'var(--text-primary)' }}>Rs. {fNum(matchData.otherCosts)}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--accent-blue)',
                }}
              >
                <span>Total Ground Expense</span>
                <span>Rs. {fNum(matchExpenses)}</span>
              </div>
            </div>

            <div
              style={{
                marginTop: '20px',
                padding: '12px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}
            >
              Per-player collection target is set at <strong>Rs. {fNum(matchData.perPlayerFee)}</strong>.
            </div>
          </Card>

          {/* Squad Player Collections Ledger */}
          <Card>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Users size={16} color="var(--accent-blue)" />
                  Squad Payment Ledger ({payments.length} Players)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Collected: <strong style={{ color: 'var(--accent-green)' }}>Rs. {fNum(totalCollected)}</strong> / Rs. {fNum(totalAssigned)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {totalPending > 0 && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle2 size={13} />}
                    onClick={handleMarkAllPaid}
                    title="Mark all pending squad match fees as paid"
                  >
                    <span>Match Fee Paid (Rs. {fNum(totalPending)})</span>
                  </Button>
                )}
                <Button
                  variant={showAddPlayerPayment ? 'secondary' : 'primary'}
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setShowAddPlayerPayment(!showAddPlayerPayment)}
                >
                  {showAddPlayerPayment ? 'Cancel' : '+ Add Player Fee'}
                </Button>
              </div>
            </div>

            {/* Inline Add Player Fee Form */}
            {showAddPlayerPayment && (
              <AssignSquadFeeForm
                matchId={id}
                defaultFee={matchData?.perPlayerFee || 1000}
                players={players}
                excludePlayerIds={payments.map((p: any) => p.playerId?._id || p.playerId).filter(Boolean)}
                onSuccess={() => {
                  setShowAddPlayerPayment(false);
                  invalidateData();
                }}
                onCancel={() => setShowAddPlayerPayment(false)}
              />
            )}

            <DataTable<any>
              data={payments}
              keyExtractor={(p) => p._id}
              emptyMessage="No squad players registered for this match yet."
              columns={[
                {
                  header: 'Player',
                  render: (p) => {
                    const player = p.playerId;
                    return (
                      <div>
                        <Link
                          href={`/players/${player?._id || ''}`}
                          style={{
                            textDecoration: 'none',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                          }}
                        >
                          {player?.name || 'Unknown Player'}
                        </Link>
                        {player?.role && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {player.role.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    );
                  },
                },
                {
                  header: 'Fee Assigned',
                  render: (p) => <>Rs. {fNum(p.feeAssigned)}</>,
                },
                {
                  header: 'Fee Paid',
                  render: (p) => {
                    const isPaid = p.paymentStatus === 'paid';
                    return (
                      <span
                        style={{
                          fontWeight: 600,
                          color: isPaid ? 'var(--accent-green)' : 'var(--accent-rose)',
                        }}
                      >
                        Rs. {fNum(p.feePaid)}
                      </span>
                    );
                  },
                },
                {
                  header: 'Status',
                  render: (p) => {
                    const isPaid = p.paymentStatus === 'paid';
                    return (
                      <Badge
                        variant={
                          isPaid
                            ? 'success'
                            : p.paymentStatus === 'partial'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {p.paymentStatus.toUpperCase()}
                      </Badge>
                    );
                  },
                },
                {
                  header: 'Method',
                  render: (p) => (
                    <span
                      style={{
                        textTransform: 'capitalize',
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {p.paymentMethod?.replace('_', ' ') || 'Cash'}
                    </span>
                  ),
                },
                {
                  header: 'Actions',
                  align: 'right',
                  render: (p) => {
                    const isPaid = p.paymentStatus === 'paid';
                    return (
                      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                        {!isPaid && (
                          <Button
                            variant="success"
                            size="sm"
                            icon={<CheckCircle2 size={14} />}
                            onClick={() => handleQuickMarkPaid(p)}
                            title="1-Click Mark Fully Paid"
                          >
                            Paid
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          isIconOnly
                          icon={<Pencil size={14} color="var(--accent-blue)" />}
                          onClick={() => {
                            setEditingPayment(p);
                          }}
                          title="Edit Payment"
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          isIconOnly
                          icon={<Trash2 size={14} />}
                          onClick={(e) => { e.stopPropagation(); handleDeletePayment(p._id, p.playerId?.name); }}
                          title="Remove Player from Match"
                        />
                      </div>
                    );
                  },
                },
              ]}
            />
          </Card>
        </div>
      </div>

      {/* Edit Match Modal */}
      <EditMatchModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        match={matchData}
        onSuccess={invalidateData}
      />

      {/* Edit Payment Modal */}
      <EditPaymentModal
        payment={editingPayment}
        onClose={() => setEditingPayment(null)}
        onSuccess={invalidateData}
      />
    </>
  );
}
