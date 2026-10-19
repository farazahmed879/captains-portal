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
  Select,
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

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const [editFormData, setEditFormData] = useState({
    name: '',
    organizer: '',
    venue: '',
    format: 'Hard Ball',
    entryFee: 0,
    expectedWinningPrize: 0,
    actualWinningPrizeWon: 0,
    status: 'ongoing',
    notes: '',
  });

  const loadData = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{
      success: boolean;
      tournament: any;
      matches: any[];
      expenses: any[];
      sponsors: any[];
    }>(`/tournaments/${id}`)
      .then((res) => {
        if (res.success) {
          setData(res);
          const t = res.tournament;
          setEditFormData({
            name: t.name,
            organizer: t.organizer || '',
            venue: t.venue || '',
            format: t.format || 'Hard Ball',
            entryFee: t.entryFee || 0,
            expectedWinningPrize: t.expectedWinningPrize || 0,
            actualWinningPrizeWon: t.actualWinningPrizeWon || 0,
            status: t.status || 'ongoing',
            notes: t.notes || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadData();
      }
    } catch (err) {
      alert('Failed to update tournament');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete tournament "${data?.tournament?.name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/tournaments/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/tournaments');
      }
    } catch (err) {
      alert('Failed to delete tournament');
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
              🏆 {tournament.notes}
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

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage & Title</TableHead>
                <TableHead>Date & Venue</TableHead>
                <TableHead>Ground & Ref Cost</TableHead>
                <TableHead>Result / Score</TableHead>
                <TableHead>MOM</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.length === 0 ? (
                <TableEmpty colSpan={6} message="No matches recorded yet for this tournament." />
              ) : (
                matches.map((m: any) => (
                  <TableRow key={m._id}>
                    <TableCell>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {m.notes || m.venue}
                      </div>
                      <Badge variant="purple" style={{ fontSize: '10px', marginTop: '2px' }}>
                        {m.tournamentStage}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{m.venue}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(m.matchDate).toLocaleDateString()}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
                        Rs. {fNum(m.totalMatchExpense)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getResultBadgeVariant(m.result)}>
                        {m.result?.toUpperCase()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {m.momPlayerId ? (
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
                      )}
                    </TableCell>

                    <TableCell align="right">
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal: Edit Tournament */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Tournament Details"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleUpdate}>
                Save Changes
              </Button>
            </>
          }
        >
          <form onSubmit={handleUpdate}>
            <div className="grid-2">
              <Input
                label="Tournament Name *"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                required
              />

              <Select
                label="Format"
                value={editFormData.format}
                onChange={(e) => setEditFormData({ ...editFormData, format: e.target.value })}
                options={[
                  { value: 'Hard Ball', label: 'Hard Ball' },
                  { value: 'Tape Ball', label: 'Tape Ball' },
                  { value: 'T20', label: 'T20' },
                  { value: 'T10', label: 'T10' },
                  { value: '100 Balls', label: '100 Balls' },
                ]}
              />
            </div>

            <div className="grid-2">
              <Input
                label="Venue / Stadium"
                value={editFormData.venue}
                onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
              />

              <Select
                label="Status"
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                options={[
                  { value: 'upcoming', label: 'Upcoming' },
                  { value: 'ongoing', label: 'Ongoing' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'champions', label: 'Champions' },
                ]}
              />
            </div>

            <div className="grid-3">
              <Input
                label="Entry Fee (Rs.)"
                type="number"
                value={editFormData.entryFee}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, entryFee: Number(e.target.value) })
                }
              />

              <Input
                label="Expected Prize (Rs.)"
                type="number"
                value={editFormData.expectedWinningPrize}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    expectedWinningPrize: Number(e.target.value),
                  })
                }
              />

              <Input
                label="Actual Won (Rs.)"
                type="number"
                value={editFormData.actualWinningPrizeWon}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    actualWinningPrizeWon: Number(e.target.value),
                  })
                }
              />
            </div>

            <Textarea
              label="Notes / Remarks"
              rows={2}
              value={editFormData.notes}
              onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            />
          </form>
        </Modal>
      </div>
    </>
  );
}
