'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';
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
import { MatchExpenseModal } from '../../../components/MatchExpenseModal';
import { EditMomModal } from '../../../components/EditMomModal';
import { EditPaymentModal } from '../../../components/EditPaymentModal';
import { SquadFeesModal } from '../../../components/SquadFeesModal';
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
  const [isExpenseOpen, setIsExpenseOpen] = useState<boolean>(false);
  const [isMomOpen, setIsMomOpen] = useState<boolean>(false);
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
                title="Mark all pending squad player fees as paid"
              >
                Clear Player Dues
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<Receipt size={13} color="var(--accent-rose)" />}
              onClick={() => setIsExpenseOpen(true)}
              title="Record or update ground fee / match fee paid to organizer"
            >
              Match Fee
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<Award size={13} color="#d97706" />}
              onClick={() => setIsMomOpen(true)}
              title="Record or update Man of the Match and organizer cash prize"
            >
              MOM Award {matchData?.momPrizeMoney ? `(Rs. ${fNum(matchData.momPrizeMoney)})` : ''}
            </Button>
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

          {/* Man of the match card */}
          {matchData.momPlayerId ? (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
                border: '1px solid #fde68a',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#fde68a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Award size={20} color="#b45309" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e' }}>
                    Man of the Match:
                    <Link
                      href={`/players/${matchData.momPlayerId._id || matchData.momPlayerId}`}
                      style={{ color: '#b45309', fontWeight: 800, marginLeft: '6px', textDecoration: 'underline' }}
                    >
                      {matchData.momPlayerId.name || 'Player'}
                    </Link>
                    {matchData.momPlayerId.role && (
                      <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 500, marginLeft: '4px' }}>
                        ({matchData.momPlayerId.role.replace('_', ' ')})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803d' }}>
                      Organizer Cash Prize: Rs. {fNum(matchData.momPrizeMoney || 0)}
                    </span>
                    {matchData.momAwardDetails && (
                      <span style={{ fontSize: '12px', color: '#78350f', fontWeight: 500 }}>
                        • {matchData.momAwardDetails}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<Pencil size={11} color="#b45309" />}
                onClick={() => setIsMomOpen(true)}
                style={{
                  height: '28px',
                  fontSize: '11px',
                  padding: '0 10px',
                  borderColor: '#fcd34d',
                  background: '#ffffff',
                  color: '#92400e',
                }}
              >
                Edit MOM
              </Button>
            </div>
          ) : (
            <div
              style={{
                marginTop: '14px',
                padding: '8px 14px',
                background: '#fafafa',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                <Award size={15} color="#94a3b8" />
                <span>Won this match? Record organizer Man of the Match (MOM) cash prize.</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMomOpen(true)}
                style={{ height: '24px', fontSize: '11px', padding: '0 8px' }}
              >
                + Add MOM Award
              </Button>
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

        {/* Unified 2-Column Squad Payment Ledger & Stats */}
        <SquadFeesModal
          inline
          match={matchData}
          initialPayments={payments}
          players={players}
          onSuccess={invalidateData}
          onEditExpenses={() => setIsExpenseOpen(true)}
        />
      </div>

      {/* Match Fee & Ground Expenses Modal */}
      <MatchExpenseModal
        isOpen={isExpenseOpen}
        onClose={() => setIsExpenseOpen(false)}
        match={matchData}
        onSuccess={invalidateData}
      />

      {/* Edit Man of the Match Modal */}
      <EditMomModal
        isOpen={isMomOpen}
        onClose={() => setIsMomOpen(false)}
        match={matchData}
        players={players}
        onSuccess={invalidateData}
      />

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
