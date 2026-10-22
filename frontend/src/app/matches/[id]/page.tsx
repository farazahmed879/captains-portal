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
  DatePicker,
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

  const [matchData, setMatchData] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddPlayerPayment, setShowAddPlayerPayment] = useState<boolean>(false);
  const [newPayment, setNewPayment] = useState({
    playerId: '',
    feeAssigned: 1000,
    feePaid: 1000,
    paymentMethod: 'cash',
  });

  // Edit Match Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    opponentTeam: '',
    matchDate: '',
    venue: '',
    overs: 20,
    tournamentStage: '',
    result: 'pending',
    ourScore: '',
    opponentScore: '',
    groundCost: 0,
    umpireCost: 0,
    ballCost: 0,
    refreshmentCost: 0,
    otherCosts: 0,
    perPlayerFee: 0,
    notes: '',
  });

  // Edit Payment Modal state
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    feePaid: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  const loadMatch = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{ success: boolean; match: any; payments: any[] }>(`/matches/${id}`)
      .then((res) => {
        if (res.success) {
          setMatchData(res.match);
          setPayments(res.payments || []);
          const m = res.match;
          setEditFormData({
            opponentTeam: m.opponentTeam || '',
            matchDate: m.matchDate ? new Date(m.matchDate).toISOString().split('T')[0] : '',
            venue: m.venue || '',
            overs: m.overs || 20,
            tournamentStage: m.tournamentStage || '',
            result: m.result || 'pending',
            ourScore: m.ourScore || '',
            opponentScore: m.opponentScore || '',
            groundCost: m.groundCost || 0,
            umpireCost: m.umpireCost || 0,
            ballCost: m.ballCost || 0,
            refreshmentCost: m.refreshmentCost || 0,
            otherCosts: m.otherCosts || 0,
            perPlayerFee: m.perPlayerFee || 0,
            notes: m.notes || '',
          });
          if (m.perPlayerFee) {
            setNewPayment((prev) => ({
              ...prev,
              feeAssigned: m.perPlayerFee,
              feePaid: m.perPlayerFee,
            }));
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMatch();
    fetchApi<{ success: boolean; players: any[] }>('/players').then((res) => {
      if (res.success) setPlayers(res.players || []);
    });
  }, [id]);

  const handleUpdateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadMatch();
      }
    } catch (err) {
      alert('Failed to update match');
    }
  };

  const handleDeleteMatch = async () => {
    if (!confirm(`Are you sure you want to delete match vs "${matchData?.opponentTeam}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/matches/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/matches');
      }
    } catch (err) {
      alert('Failed to delete match');
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
        loadMatch();
      }
    } catch (err) {
      alert('Failed to update payment');
    }
  };

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${editingPayment._id}`, {
        method: 'PUT',
        body: JSON.stringify(paymentFormData),
      });
      if (res.success) {
        setEditingPayment(null);
        loadMatch();
      }
    } catch (err) {
      alert('Failed to update payment record');
    }
  };

  const handleAddPlayerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newPayment.playerId) return;
    try {
      const res = await fetchApi<{ success: boolean; payment: any }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          matchId: id,
          playerId: newPayment.playerId,
          feeAssigned: Number(newPayment.feeAssigned) || 0,
          feePaid: Number(newPayment.feePaid) || 0,
          paymentMethod: newPayment.paymentMethod,
        }),
      });
      if (res.success) {
        setNewPayment({
          playerId: '',
          feeAssigned: matchData?.perPlayerFee || 1000,
          feePaid: matchData?.perPlayerFee || 1000,
          paymentMethod: 'cash',
        });
        setShowAddPlayerPayment(false);
        loadMatch();
      }
    } catch (err) {
      alert('Failed to add player fee');
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Remove this player payment record from match?')) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        loadMatch();
      }
    } catch (err) {
      alert('Failed to remove player payment');
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
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Match Details...
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
                      🏆 {matchData.tournamentId.name}
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
              📝 {matchData.notes}
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
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
              💡 Per-player collection target is set at <strong>Rs. {fNum(matchData.perPlayerFee)}</strong>.
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
              <form
                onSubmit={handleAddPlayerPayment}
                style={{
                  padding: '16px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: 'var(--accent-blue)',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={15} />
                  <span>Assign Match Fee to Player</span>
                </div>
                <div className="grid-3" style={{ marginBottom: '12px' }}>
                  <Select
                    label="Select Player *"
                    value={newPayment.playerId}
                    onChange={(e) =>
                      setNewPayment({ ...newPayment, playerId: e.target.value })
                    }
                    required
                    options={[
                      { value: '', label: '— Choose Player —' },
                      ...players.map((p) => ({
                        value: p._id,
                        label: `${p.name} ${p.jerseyNumber ? `(#${p.jerseyNumber})` : ''}`,
                      })),
                    ]}
                  />
                  <Input
                    label="Fee Assigned (Rs.) *"
                    type="number"
                    value={newPayment.feeAssigned}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        feeAssigned: Number(e.target.value),
                      })
                    }
                    required
                  />
                  <Input
                    label="Fee Paid (Rs.) *"
                    type="number"
                    value={newPayment.feePaid}
                    onChange={(e) =>
                      setNewPayment({
                        ...newPayment,
                        feePaid: Number(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowAddPlayerPayment(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    type="submit"
                    icon={<CheckCircle2 size={14} />}
                  >
                    Save Player Fee
                  </Button>
                </div>
              </form>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Fee Assigned</TableHead>
                  <TableHead>Fee Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead align="right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableEmpty colSpan={6} message="No squad players registered for this match yet." />
                ) : (
                  payments.map((p) => {
                    const player = p.playerId;
                    const isPaid = p.paymentStatus === 'paid';
                    return (
                      <TableRow key={p._id}>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>Rs. {fNum(p.feeAssigned)}</TableCell>
                        <TableCell
                          style={{
                            fontWeight: 600,
                            color: isPaid ? 'var(--accent-green)' : 'var(--accent-rose)',
                          }}
                        >
                          Rs. {fNum(p.feePaid)}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell
                          style={{
                            textTransform: 'capitalize',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {p.paymentMethod?.replace('_', ' ') || 'Cash'}
                        </TableCell>
                        <TableCell align="right">
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
                                setPaymentFormData({
                                  feePaid: p.feePaid || 0,
                                  paymentMethod: p.paymentMethod || 'cash',
                                  notes: p.notes || '',
                                });
                              }}
                              title="Edit Payment"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              isIconOnly
                              icon={<Trash2 size={14} />}
                              onClick={() => handleDeletePayment(p._id)}
                              title="Remove Player from Match"
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>

      {/* Edit Match Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Match vs ${matchData.opponentTeam}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateMatch}>
              Save Match Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateMatch}>
          <div className="grid-2">
            <Input
              label="Opponent Team *"
              value={editFormData.opponentTeam}
              onChange={(e) => setEditFormData({ ...editFormData, opponentTeam: e.target.value })}
              required
            />
            <DatePicker
              label="Match Date *"
              value={editFormData.matchDate}
              onChange={(e) => setEditFormData({ ...editFormData, matchDate: e.target.value })}
              required
            />
          </div>

          <div className="grid-2">
            <Input
              label="Venue"
              value={editFormData.venue}
              onChange={(e) => setEditFormData({ ...editFormData, venue: e.target.value })}
            />
            <Input
              label="Overs"
              type="number"
              value={editFormData.overs}
              onChange={(e) =>
                setEditFormData({ ...editFormData, overs: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid-3">
            <Select
              label="Result"
              value={editFormData.result}
              onChange={(e) => setEditFormData({ ...editFormData, result: e.target.value })}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'won', label: 'Won' },
                { value: 'lost', label: 'Lost' },
                { value: 'tied', label: 'Tied' },
                { value: 'abandoned', label: 'Abandoned' },
              ]}
            />
            <Input
              label="Our Score"
              placeholder="e.g. 175/4 (20)"
              value={editFormData.ourScore}
              onChange={(e) => setEditFormData({ ...editFormData, ourScore: e.target.value })}
            />
            <Input
              label="Opponent Score"
              placeholder="e.g. 142/9 (20)"
              value={editFormData.opponentScore}
              onChange={(e) =>
                setEditFormData({ ...editFormData, opponentScore: e.target.value })
              }
            />
          </div>

          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--accent-blue)',
              margin: '14px 0 8px',
            }}
          >
            Itemized Match Ground Expenses
          </div>

          <div className="grid-3">
            <Input
              label="Pitch Rent (Rs.)"
              type="number"
              value={editFormData.groundCost}
              onChange={(e) =>
                setEditFormData({ ...editFormData, groundCost: Number(e.target.value) })
              }
            />
            <Input
              label="Umpires (Rs.)"
              type="number"
              value={editFormData.umpireCost}
              onChange={(e) =>
                setEditFormData({ ...editFormData, umpireCost: Number(e.target.value) })
              }
            />
            <Input
              label="Balls (Rs.)"
              type="number"
              value={editFormData.ballCost}
              onChange={(e) =>
                setEditFormData({ ...editFormData, ballCost: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid-3">
            <Input
              label="Refreshment (Rs.)"
              type="number"
              value={editFormData.refreshmentCost}
              onChange={(e) =>
                setEditFormData({ ...editFormData, refreshmentCost: Number(e.target.value) })
              }
            />
            <Input
              label="Other Costs (Rs.)"
              type="number"
              value={editFormData.otherCosts}
              onChange={(e) =>
                setEditFormData({ ...editFormData, otherCosts: Number(e.target.value) })
              }
            />
            <Input
              label="Per-Player Fee (Rs.)"
              type="number"
              value={editFormData.perPlayerFee}
              onChange={(e) =>
                setEditFormData({ ...editFormData, perPlayerFee: Number(e.target.value) })
              }
            />
          </div>

          <Textarea
            label="Notes / Captain Remarks"
            rows={2}
            value={editFormData.notes}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={!!editingPayment}
        onClose={() => setEditingPayment(null)}
        title={`Update Payment: ${editingPayment?.playerId?.name || 'Player'}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingPayment(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePayment}>
              Save Payment
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdatePayment}>
          <Input
            label="Fee Assigned"
            type="text"
            value={`Rs. ${fNum(editingPayment?.feeAssigned)}`}
            disabled
          />

          <Input
            label="Amount Paid (Rs.) *"
            type="number"
            value={paymentFormData.feePaid}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, feePaid: Number(e.target.value) })
            }
            required
          />

          <Select
            label="Payment Method"
            value={paymentFormData.paymentMethod}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })
            }
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'online', label: 'Online Transfer / Bank' },
              { value: 'sponsor_covered', label: 'Covered by Sponsor' },
            ]}
          />

          <Input
            label="Notes / Receipt Note"
            type="text"
            value={paymentFormData.notes}
            onChange={(e) =>
              setPaymentFormData({ ...paymentFormData, notes: e.target.value })
            }
          />
        </form>
      </Modal>
    </>
  );
}
