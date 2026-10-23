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
import { EditTournamentModal } from '../../../components/EditTournamentModal';
import {
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
} from '../../../components/icons';

export default function TournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const tournamentQuery = useQuery({
    queryKey: queryKeys.tournament(id),
    queryFn: () =>
      fetchApi<{
        success: boolean;
        tournament: any;
        matches: any[];
        expenses: any[];
        sponsors: any[];
      }>(`/tournaments/${id}`),
    enabled: !!id,
  });

  const data = tournamentQuery.data;
  const loading = tournamentQuery.isLoading;

  const invalidateData = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tournament(id) });
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
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
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Tournament Profile...
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
  const totalReturns = totalPrizeWon + sponsorFunds;
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

        {/* 4 Financial Metric Cards */}
        <div className="grid-4">
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
            variant="emerald"
            title="Dedicated Sponsors"
            value={`Rs. ${fNum(sponsorFunds)}`}
            subtitle={`${sponsors.length} Brand Partners Tagged`}
            icon={<UsersIcon size={20} color="var(--accent-green)" />}
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
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                Tournament Matches ({matches.length})
              </h2>
            </div>
          </div>

          <DataTable
            data={matches}
            keyExtractor={(m: any) => m._id}
            emptyMessage="No matches recorded yet for this tournament."
            columns={[
              {
                header: 'Stage & Title',
                width: '28%',
                render: (m: any) => (
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                      {m.notes || m.venue}
                    </div>
                    <Badge variant="purple" style={{ fontSize: '10px', marginTop: '2px' }}>
                      {m.tournamentStage}
                    </Badge>
                  </div>
                ),
              },
              {
                header: 'Date & Venue',
                width: '22%',
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
                header: 'Ground & Ref Cost',
                width: '16%',
                style: { fontWeight: 700, color: 'var(--accent-rose)' },
                render: (m: any) => `Rs. ${fNum(m.totalMatchExpense)}`,
              },
              {
                header: 'Result / Score',
                width: '12%',
                render: (m: any) => (
                  <Badge variant={getResultBadgeVariant(m.result)}>
                    {m.result?.toUpperCase()}
                  </Badge>
                ),
              },
              {
                header: 'MOM',
                width: '12%',
                render: (m: any) =>
                  m.momPlayerId ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '12px',
                        color: '#b45309',
                      }}
                    >
                      <TrophyIcon size={12} />
                      <strong>{m.momPlayerId.name}</strong>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>-</span>
                  ),
              },
              {
                header: 'Actions',
                width: '10%',
                align: 'right',
                render: (m: any) => (
                  <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                    <Link href={`/matches/${m._id}`} passHref legacyBehavior>
                      <Button
                        variant="secondary"
                        size="sm"
                        iconRight={<ExternalLinkIcon size={12} />}
                      >
                        Match Profile
                      </Button>
                    </Link>
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* Modal: Edit Tournament */}
        <EditTournamentModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          tournament={data?.tournament}
          onSuccess={invalidateData}
        />
      </div>
    </>
  );
}
