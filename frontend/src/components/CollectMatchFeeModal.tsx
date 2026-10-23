'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Button, Alert, DataTable, Badge, StatBadge } from './ui';
import { Plus, CheckCircle2, AlertCircle } from './icons';
import { fetchApi } from '../lib/api';
import { confirmDuesClear, showToast } from '../lib/alerts';
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from '../constants';
import { formatCurrency, formatNumber } from '../lib/format';

interface MatchPaymentFormValues {
  matchId: string;
  paymentMethod: string;
  feeAssigned: number | '';
  feePaid: number | '';
  notes: string;
}

interface CollectMatchFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any | null;
  onSuccess: () => void;
}

export const CollectMatchFeeModal: React.FC<CollectMatchFeeModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [playerMatches, setPlayerMatches] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [activePlayer, setActivePlayer] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MatchPaymentFormValues>({
    defaultValues: {
      matchId: '',
      paymentMethod: PaymentMethod.CASH,
      feeAssigned: 1000,
      feePaid: 1000,
      notes: '',
    },
  });

  const loadData = async (targetPlayer: any) => {
    if (!targetPlayer?._id) return;
    setLoading(true);
    setServerError(null);
    try {
      const [profileRes, matchesRes] = await Promise.all([
        fetchApi<{ success: boolean; player: any; ledger: any }>(`/players/${targetPlayer._id}`),
        fetchApi<{ success: boolean; matches: any[] }>('/matches'),
      ]);

      if (profileRes.success) {
        setPlayerMatches(profileRes.ledger?.matchHistory || []);
        setActivePlayer({
          ...targetPlayer,
          ...profileRes.player,
          pendingDue: profileRes.ledger?.pendingDue ?? targetPlayer.pendingDue,
          totalFeePaid: profileRes.ledger?.totalFeePaid ?? targetPlayer.totalFeePaid,
          totalFeeAssigned: profileRes.ledger?.totalFeeAssigned ?? targetPlayer.totalFeeAssigned,
        });
      }

      if (matchesRes.success && matchesRes.matches) {
        setAllMatches(matchesRes.matches);
        if (matchesRes.matches.length > 0) {
          const first = matchesRes.matches[0];
          setValue('matchId', first._id);
          setValue('feeAssigned', first.perPlayerFee || 1000);
          setValue('feePaid', first.perPlayerFee || 1000);
        }
      }
    } catch (err: any) {
      setServerError(err?.message || 'Failed to load player financial data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && player) {
      setActivePlayer(player);
      loadData(player);
    } else {
      reset();
      setPlayerMatches([]);
      setAllMatches([]);
      setActivePlayer(null);
      setServerError(null);
    }
  }, [isOpen, player]);

  const handleQuickPayMatch = async (paymentId: string, fullFee: number) => {
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${paymentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: fullFee,
          paymentMethod: PaymentMethod.CASH,
          paymentDate: new Date().toISOString(),
        }),
      });
      if (res.success) {
        if (activePlayer) await loadData(activePlayer);
        onSuccess();
      }
    } catch (err: any) {
      setServerError(err?.message || 'Failed to update payment.');
    }
  };

  const handleClearAllPendingDues = async () => {
    const pendingList = playerMatches.filter((p) => p.paymentStatus !== 'paid');
    const totalDue = pendingList.reduce((sum, p) => sum + ((p.feeAssigned || 0) - (p.feePaid || 0)), 0);
    const confirmed = await confirmDuesClear(pendingList.length, formatNumber(totalDue), activePlayer.name);
    if (!confirmed) return;

    try {
      const updates = pendingList.map((p) => ({
        id: p._id,
        feePaid: p.feeAssigned,
        paymentMethod: PaymentMethod.CASH,
        paymentDate: new Date().toISOString(),
      }));

      const res = await fetchApi<{ success: boolean }>('/payments/bulk', {
        method: 'PUT',
        body: JSON.stringify({ updates }),
      });

      if (res.success) {
        showToast.success(`Cleared ${pendingList.length} match fees for ${activePlayer.name}!`);
        await loadData(activePlayer);
        onSuccess();
      }
    } catch (err: any) {
      showToast.error(err?.message || 'Failed to clear pending dues.');
      setServerError(err?.message || 'Failed to clear pending dues.');
    }
  };

  const onSubmitNewFee = async (values: MatchPaymentFormValues) => {
    if (!activePlayer?._id || !values.matchId) return;
    setServerError(null);
    try {
      const res = await fetchApi<{ success: boolean }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          matchId: values.matchId,
          playerId: activePlayer._id,
          feeAssigned: Number(values.feeAssigned) || 0,
          feePaid: Number(values.feePaid) || 0,
          paymentMethod: values.paymentMethod,
          notes: values.notes || undefined,
        }),
      });

      if (res.success) {
        await loadData(activePlayer);
        onSuccess();
        setValue('notes', '');
      } else {
        setServerError('Failed to assign/collect match fee.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Error recording match fee.');
    }
  };

  const pendingMatches = playerMatches.filter((p) => p.paymentStatus !== 'paid');
  const totalPending = pendingMatches.reduce(
    (sum, p) => sum + ((p.feeAssigned || 0) - (p.feePaid || 0)),
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activePlayer ? `Collect Match Fee — ${activePlayer.name}` : 'Collect Match Fee'}
      maxWidth="750px"
    >
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading player fee ledger...
        </div>
      ) : (
        <div className="form-stack">
          {serverError && (
            <Alert variant="danger" title="Fee Operation Error">
              {serverError}
            </Alert>
          )}

          {/* Player Financial Summary Bar */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <StatBadge
              variant="success"
              label="Collected"
              value={formatCurrency(activePlayer?.totalFeePaid || 0)}
            />
            <StatBadge
              variant={(activePlayer?.pendingDue || 0) > 0 ? 'danger' : 'success'}
              label="Outstanding"
              value={(activePlayer?.pendingDue || 0) > 0 ? `${formatCurrency(activePlayer?.pendingDue)} Due` : 'Cleared'}
            />
            <StatBadge
              variant="primary"
              label="Matches Tracked"
              value={String(playerMatches.length)}
            />
          </div>

          {/* Section 1: Pending Match Dues */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <h4
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  margin: 0,
                }}
              >
                <AlertCircle
                  size={15}
                  color={pendingMatches.length > 0 ? 'var(--accent-rose)' : 'var(--accent-green)'}
                />
                Pending Match Fees ({pendingMatches.length})
              </h4>

              {pendingMatches.length > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<CheckCircle2 size={14} />}
                  onClick={handleClearAllPendingDues}
                >
                  Clear All Pending ({formatCurrency(totalPending)})
                </Button>
              )}
            </div>

            {pendingMatches.length === 0 ? (
              <Alert variant="success" title="All Cleared">
                All previous match fees are 100% cleared! No outstanding dues.
              </Alert>
            ) : (
              <DataTable<any>
                data={pendingMatches}
                keyExtractor={(rec) => rec._id}
                emptyMessage="No pending matches found."
                columns={[
                  {
                    header: 'Match / Venue',
                    render: (rec) => {
                      const match = rec.matchId;
                      return (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            vs {match?.opponentTeam || 'Opponent'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {match?.venue || 'Venue'} • {match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : ''}
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    header: 'Assigned',
                    render: (rec) => formatCurrency(rec.feeAssigned),
                  },
                  {
                    header: 'Paid',
                    render: (rec) => (
                      <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                        {formatCurrency(rec.feePaid)}
                      </span>
                    ),
                  },
                  {
                    header: 'Balance',
                    render: (rec) => {
                      const bal = (rec.feeAssigned || 0) - (rec.feePaid || 0);
                      return (
                        <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                          {formatCurrency(bal)}
                        </span>
                      );
                    },
                  },
                  {
                    header: 'Action',
                    align: 'right',
                    render: (rec) => (
                      <Button
                        variant="success"
                        size="sm"
                        icon={<CheckCircle2 size={13} />}
                        onClick={() => handleQuickPayMatch(rec._id, rec.feeAssigned)}
                        title="Mark Cleared"
                      >
                        Mark Paid
                      </Button>
                    ),
                  },
                ]}
              />
            )}
          </div>

          {/* Section 2: Assign / Record New Match Fee Form */}
          <div
            style={{
              padding: '16px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '10px',
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
              <span>Assign / Collect Fee for Another Match</span>
            </div>

            <form onSubmit={handleSubmit(onSubmitNewFee)} className="form-stack">
              <div className="grid-2">
                <Select
                  label="Select Match *"
                  {...register('matchId', { required: 'Please select a match' })}
                  error={errors.matchId?.message}
                  onChange={(e) => {
                    const mId = e.target.value;
                    setValue('matchId', mId);
                    const selectedM = allMatches.find((m) => m._id === mId);
                    if (selectedM) {
                      const fee = selectedM.perPlayerFee || 1000;
                      setValue('feeAssigned', fee);
                      setValue('feePaid', fee);
                    }
                  }}
                  options={[
                    { value: '', label: '— Choose Match —' },
                    ...allMatches.map((m) => ({
                      value: m._id,
                      label: `vs ${m.opponentTeam} (${new Date(m.matchDate).toLocaleDateString()}) - ${m.venue || ''}`,
                    })),
                  ]}
                />
                <Select
                  label="Payment Method"
                  options={PAYMENT_METHOD_OPTIONS}
                  {...register('paymentMethod')}
                  error={errors.paymentMethod?.message}
                />
              </div>

              <div className="grid-2">
                <Input
                  label="Fee Assigned (Rs.) *"
                  type="number"
                  placeholder="1000"
                  {...register('feeAssigned', {
                    required: 'Fee assigned is required',
                    min: { value: 0, message: 'Fee cannot be negative' },
                  })}
                  error={errors.feeAssigned?.message}
                />
                <Input
                  label="Fee Paid (Rs.) *"
                  type="number"
                  placeholder="1000"
                  {...register('feePaid', {
                    required: 'Fee paid is required',
                    min: { value: 0, message: 'Fee cannot be negative' },
                  })}
                  error={errors.feePaid?.message}
                />
              </div>

              <Input
                label="Notes / Receipt Note"
                placeholder="Optional notes..."
                {...register('notes')}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button
                  variant="primary"
                  onClick={handleSubmit(onSubmitNewFee)}
                  loading={isSubmitting}
                >
                  Save Match Fee Record
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  );
};
