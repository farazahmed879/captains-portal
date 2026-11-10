'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryKeys';
import { Header } from '../../../components/Header';
import { fetchApi } from '../../../lib/api';
import { formatDateWithDay, formatNumber } from '../../../lib/format';
import { confirmDelete, showToast } from '../../../lib/alerts';
import { Button, Badge, Modal, Card } from '../../../components/ui';
import { DetailPageSkeleton } from '../../../components/ui/Skeleton';
import { EditMatchModal } from '../../../components/EditMatchModal';
import { MatchExpenseModal } from '../../../components/MatchExpenseModal';
import { EditMomModal } from '../../../components/EditMomModal';
import { EditPaymentModal } from '../../../components/EditPaymentModal';
import { SquadFeesModal } from '../../../components/SquadFeesModal';
import {
  Award,
} from '../../../components/icons';
import { getMatchResultVariant } from '../../../constants/badgeVariants';
import { EMPTY_VALUE } from '../../../constants';
import { DetailNav } from '../../../components/DetailNav';

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

  return (
    <>
      <Header
        title={`Match vs ${matchData.opponentTeam}`}
        subtitle="Match scorecard, itemized ground expenses & squad collection ledger"
      />

      <div className="content-body">
        <DetailNav back={{ href: "/matches", label: "Back to All Matches" }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditOpen(true)}
          >
            Edit Match
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteMatch}
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
                    <Badge variant="purple">
                      {matchData.tournamentId.name}
                    </Badge>
                  </Link>
                )}

                {matchData.tournamentStage && (
                  <Badge variant="secondary">{matchData.tournamentStage}</Badge>
                )}

                <Badge variant={getMatchResultVariant(matchData.result)}>
                  {matchData.result ? matchData.result.toUpperCase() : 'PENDING'}
                </Badge>
              </div>

              <h1
                style={{
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '10px',
                }}
              >
                {matchData.teamId?.name || EMPTY_VALUE}{' '}
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
                  {matchData.venue || 'Standard Ground'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {formatDateWithDay(matchData.matchDate)}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {matchData.overs} Overs Match
                </span>
              </div>
            </div>
          </div>

          {/* Man of the match card */}
          {matchData.momPlayerId ? (
            <div
              style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: '#e2e8f0',
                border: '1px solid #94a3b8',
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
                    background: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                    Man of the Match:
                    <Link
                      href={`/players/${matchData.momPlayerId._id || matchData.momPlayerId}`}
                      style={{ color: '#334155', fontWeight: 700, marginLeft: '6px', textDecoration: 'underline' }}
                    >
                      {matchData.momPlayerId.name || 'Player'}
                    </Link>
                    {matchData.momPlayerId.role && (
                      <span style={{ fontSize: '12px', color: '#334155', fontWeight: 500, marginLeft: '4px' }}>
                        ({matchData.momPlayerId.role.replace('_', ' ')})
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#166534' }}>
                      Organizer Cash Prize: Rs. {formatNumber(matchData.momPrizeMoney || 0)}
                    </span>
                    {matchData.momAwardDetails && (
                      <span style={{ fontSize: '12px', color: '#1e293b', fontWeight: 500 }}>
                        • {matchData.momAwardDetails}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMomOpen(true)}
                style={{
                  height: '28px',
                  fontSize: '11px',
                  padding: '0 10px',
                  borderColor: '#94a3b8',
                  background: '#ffffff',
                  color: '#334155',
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
