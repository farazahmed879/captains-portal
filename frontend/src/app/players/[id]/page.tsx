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
  UserIcon,
  PhoneIcon,
  MailIcon,
  ArrowLeftIcon,
  DollarIcon,
  AwardIcon,
  SwordsIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ShirtIcon,
  CalendarIcon,
  ExternalLinkIcon,
} from '../../../components/icons';

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Player Modal state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'all_rounder',
    battingStyle: 'right_hand',
    bowlingStyle: 'right_arm_medium',
    jerseyNumber: 0,
    kitSizeChest: '',
    kitSizeTrouser: '',
    notes: '',
  });

  // Edit Payment Modal state
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    feePaid: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  const loadPlayerProfile = () => {
    if (!id) return;
    setLoading(true);
    fetchApi<{ success: boolean; player: any; ledger: any }>(`/players/${id}`)
      .then((res) => {
        if (res.success) {
          setData(res);
          const p = res.player;
          setEditFormData({
            name: p.name || '',
            phone: p.phone || '',
            email: p.email || '',
            role: p.role || 'all_rounder',
            battingStyle: p.battingStyle || 'right_hand',
            bowlingStyle: p.bowlingStyle || 'right_arm_medium',
            jerseyNumber: p.jerseyNumber || 0,
            kitSizeChest: p.kitSizeChest || '',
            kitSizeTrouser: p.kitSizeTrouser || '',
            notes: p.notes || '',
          });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPlayerProfile();
  }, [id]);

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData),
      });
      if (res.success) {
        setIsEditOpen(false);
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to update player');
    }
  };

  const handleDeletePlayer = async () => {
    if (!confirm(`Are you sure you want to deactivate player "${data?.player?.name}"?`)) return;
    try {
      const res = await fetchApi<{ success: boolean }>(`/players/${id}`, { method: 'DELETE' });
      if (res.success) {
        router.push('/players');
      }
    } catch (err) {
      alert('Failed to deactivate player');
    }
  };

  const handleQuickMarkPaid = async (paymentId: string, fullFee: number) => {
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: fullFee,
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString(),
        }),
      });
      if (res.success) {
        loadPlayerProfile();
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
        loadPlayerProfile();
      }
    } catch (err) {
      alert('Failed to update payment record');
    }
  };

  const fNum = (val: number | undefined) => (val || 0).toLocaleString('en-US');

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Player Profile...
      </div>
    );
  }

  if (!data?.player) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--accent-rose)' }}>
        Player profile not found. <Link href="/players">Back to Players</Link>
      </div>
    );
  }

  const { player, ledger } = data;
  const matchHistory: any[] = ledger?.matchHistory || [];
  const momAwards: any[] = ledger?.momAwards || [];
  const totalAssigned = ledger?.totalFeeAssigned || 0;
  const totalPaid = ledger?.totalFeePaid || 0;
  const pendingDue = ledger?.pendingDue || 0;
  const isCleared = pendingDue <= 0;

  return (
    <>
      <Header
        title={`${player.name} - Profile`}
        subtitle="Individual Player Record, Match Fee Ledger & Performance Highlights"
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
          <Link href="/players" passHref legacyBehavior>
            <Button variant="secondary" size="sm" icon={<ArrowLeftIcon size={14} />}>
              Back to All Players
            </Button>
          </Link>

          <div className="action-group">
            <Button
              variant="secondary"
              size="sm"
              icon={<PencilIcon size={13} color="var(--accent-blue)" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit Profile
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<TrashIcon size={13} />}
              onClick={handleDeletePlayer}
            >
              Deactivate
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, var(--accent-blue), #2563eb)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 900,
                  color: '#fff',
                  boxShadow: '0 8px 16px rgba(2, 132, 199, 0.25)',
                }}
              >
                {player.jerseyNumber ? `#${player.jerseyNumber}` : player.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <Badge variant="purple">{player.role?.replace('_', ' ').toUpperCase()}</Badge>
                  <Badge variant={player.isActive !== false ? 'success' : 'danger'}>
                    {player.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                  </Badge>
                  {momAwards.length > 0 && (
                    <Badge variant="warning" icon={<AwardIcon size={11} />}>
                      {momAwards.length} MOM Award{momAwards.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                <h1
                  style={{
                    fontSize: '26px',
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: '6px',
                  }}
                >
                  {player.name}
                </h1>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    flexWrap: 'wrap',
                  }}
                >
                  {player.phone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PhoneIcon size={13} color="var(--accent-blue)" />
                      {player.phone}
                    </span>
                  )}
                  {player.email && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MailIcon size={13} />
                      {player.email}
                    </span>
                  )}
                  <span style={{ textTransform: 'capitalize' }}>
                    🏏 {player.battingStyle?.replace('_', ' ')}
                  </span>
                  <span style={{ textTransform: 'capitalize' }}>
                    ⚡ {player.bowlingStyle?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Due Status */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Match Fee Balance
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  color: isCleared ? 'var(--accent-green)' : 'var(--accent-rose)',
                }}
              >
                {isCleared ? 'CLEARED' : `Rs. ${fNum(pendingDue)}`}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {isCleared ? 'All dues up to date' : 'Outstanding Match Fee'}
              </div>
            </div>
          </div>

          {/* Kit sizing & notes pill bar */}
          {(player.kitSizeChest || player.kitSizeTrouser || player.notes) && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              {(player.kitSizeChest || player.kitSizeTrouser) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShirtIcon size={14} color="var(--accent-blue)" />
                  <span>
                    Kit Sizes: Chest <strong>{player.kitSizeChest || 'N/A'}</strong> | Trouser{' '}
                    <strong>{player.kitSizeTrouser || 'N/A'}</strong>
                  </span>
                </div>
              )}
              {player.notes && (
                <div>
                  📝 <em>{player.notes}</em>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 4 Stat Cards */}
        <div className="grid-4" style={{ marginBottom: '24px' }}>
          <StatCard
            variant="blue"
            title="Matches Played"
            value={`${matchHistory.length} Matches`}
            subtitle="Gulzar Cricket Team"
            icon={<SwordsIcon size={20} color="var(--accent-blue)" />}
          />
          <StatCard
            variant="amber"
            title="MOM Awards"
            value={`${momAwards.length} Wins`}
            subtitle="Star Performer"
            icon={<AwardIcon size={20} color="var(--accent-amber)" />}
          />
          <StatCard
            variant="emerald"
            title="Total Fee Paid"
            value={`Rs. ${fNum(totalPaid)}`}
            subtitle={`Of Rs. ${fNum(totalAssigned)} assigned`}
            icon={<DollarIcon size={20} color="var(--accent-green)" />}
          />
          <StatCard
            variant={isCleared ? 'emerald' : 'rose'}
            title="Pending Due"
            value={`Rs. ${fNum(pendingDue)}`}
            subtitle={isCleared ? 'Zero Dues' : 'Action Required'}
            icon={<AlertCircleIcon size={20} color={isCleared ? "var(--accent-green)" : "var(--accent-rose)"} />}
          />
        </div>

        {/* Match Fee Ledger History */}
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
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CalendarIcon size={16} color="var(--accent-blue)" />
              Match Fee Ledger & History ({matchHistory.length} Matches)
            </h3>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Lifetime Collected:{' '}
              <strong style={{ color: 'var(--accent-green)' }}>Rs. {fNum(totalPaid)}</strong> / Rs. {fNum(totalAssigned)}
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Match</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Fee Assigned</TableHead>
                <TableHead>Fee Paid</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead align="right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchHistory.length === 0 ? (
                <TableEmpty colSpan={8} message="No match participation recorded for this player yet." />
              ) : (
                matchHistory.map((rec) => {
                  const match = rec.matchId;
                  const isPaid = rec.paymentStatus === 'paid';
                  const due = (rec.feeAssigned || 0) - (rec.feePaid || 0);

                  return (
                    <TableRow key={rec._id}>
                      <TableCell>
                        {match ? (
                          <Link
                            href={`/matches/${match._id}`}
                            style={{
                              textDecoration: 'none',
                              color: 'var(--text-primary)',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            vs {match.opponentTeam || 'Opponent'}
                            <ExternalLinkIcon size={10} color="var(--accent-blue)" />
                          </Link>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Match info unavailable</span>
                        )}
                        {match?.result && (
                          <div
                            style={{
                              fontSize: '11px',
                              color:
                                match.result === 'won'
                                  ? 'var(--accent-green)'
                                  : 'var(--text-muted)',
                            }}
                          >
                            Result: {match.result.toUpperCase()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>Rs. {fNum(rec.feeAssigned)}</TableCell>
                      <TableCell
                        style={{
                          fontWeight: 600,
                          color: isPaid ? 'var(--accent-green)' : 'var(--accent-rose)',
                        }}
                      >
                        Rs. {fNum(rec.feePaid)}
                      </TableCell>
                      <TableCell
                        style={{
                          fontWeight: 600,
                          color: due > 0 ? 'var(--accent-rose)' : 'var(--text-muted)',
                        }}
                      >
                        Rs. {fNum(due)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            isPaid
                              ? 'success'
                              : rec.paymentStatus === 'partial'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {rec.paymentStatus.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell
                        style={{
                          textTransform: 'capitalize',
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {rec.paymentMethod?.replace('_', ' ') || 'Cash'}
                      </TableCell>
                      <TableCell align="right">
                        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
                          {!isPaid && (
                            <Button
                              variant="success"
                              size="sm"
                              icon={<CheckCircleIcon size={12} />}
                              onClick={() => handleQuickMarkPaid(rec._id, rec.feeAssigned)}
                              title="Mark Fully Paid"
                            >
                              Paid
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<PencilIcon size={11} />}
                            onClick={() => {
                              setEditingPayment(rec);
                              setPaymentFormData({
                                feePaid: rec.feePaid || 0,
                                paymentMethod: rec.paymentMethod || 'cash',
                                notes: rec.notes || '',
                              });
                            }}
                          >
                            Edit
                          </Button>
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

      {/* Edit Player Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Player: ${player.name}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdatePlayer}>
              Save Profile Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdatePlayer}>
          <div className="grid-2">
            <Input
              label="Player Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Email Address"
              type="email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            />
            <Input
              label="Jersey Number"
              type="number"
              value={editFormData.jerseyNumber}
              onChange={(e) =>
                setEditFormData({ ...editFormData, jerseyNumber: Number(e.target.value) })
              }
            />
          </div>

          <div className="grid-3">
            <Select
              label="Role"
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
              options={[
                { value: 'all_rounder', label: 'All Rounder' },
                { value: 'batter', label: 'Batter' },
                { value: 'bowler', label: 'Bowler' },
                { value: 'wicket_keeper', label: 'Wicket Keeper' },
              ]}
            />
            <Select
              label="Batting Style"
              value={editFormData.battingStyle}
              onChange={(e) =>
                setEditFormData({ ...editFormData, battingStyle: e.target.value })
              }
              options={[
                { value: 'right_hand', label: 'Right Hand' },
                { value: 'left_hand', label: 'Left Hand' },
              ]}
            />
            <Select
              label="Bowling Style"
              value={editFormData.bowlingStyle}
              onChange={(e) =>
                setEditFormData({ ...editFormData, bowlingStyle: e.target.value })
              }
              options={[
                { value: 'right_arm_medium', label: 'Right Arm Medium' },
                { value: 'right_arm_fast', label: 'Right Arm Fast' },
                { value: 'right_arm_spin', label: 'Right Arm Spin' },
                { value: 'left_arm_fast', label: 'Left Arm Fast' },
                { value: 'left_arm_spin', label: 'Left Arm Spin' },
              ]}
            />
          </div>

          <div className="grid-2">
            <Input
              label="Kit Size: Chest"
              placeholder="e.g. M, L, 40"
              value={editFormData.kitSizeChest}
              onChange={(e) =>
                setEditFormData({ ...editFormData, kitSizeChest: e.target.value })
              }
            />
            <Input
              label="Kit Size: Trouser"
              placeholder="e.g. 32, 34, L"
              value={editFormData.kitSizeTrouser}
              onChange={(e) =>
                setEditFormData({ ...editFormData, kitSizeTrouser: e.target.value })
              }
            />
          </div>

          <Textarea
            label="Notes"
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
        title="Update Match Fee Record"
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
            label="Fee Paid (Rs.) *"
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
