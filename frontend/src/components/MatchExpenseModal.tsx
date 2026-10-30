'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Textarea, Button, Alert } from './ui';
import { ReceiptIcon, Building2, Calendar, CheckCircle2 } from './icons';
import { fetchApi } from '../lib/api';
import { showToast } from '../lib/alerts';
import { formatCurrency, formatNumber } from '../lib/format';

interface MatchExpenseFormValues {
  groundCost: number | '';
  umpireCost: number | '';
  ballCost: number | '';
  refreshmentCost: number | '';
  otherCosts: number | '';
  notes: string;
}

interface MatchExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any | null;
  onSuccess: () => void;
}

export const MatchExpenseModal: React.FC<MatchExpenseModalProps> = ({
  isOpen,
  onClose,
  match,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<MatchExpenseFormValues>({
    defaultValues: {
      groundCost: 0,
      umpireCost: 0,
      ballCost: 0,
      refreshmentCost: 0,
      otherCosts: 0,
      notes: '',
    },
  });

  useEffect(() => {
    if (match && isOpen) {
      const gCost = Number(match.groundCost ?? match.totalMatchExpense) || 0;
      const uCost = Number(match.umpireCost) || 0;
      const bCost = Number(match.ballCost) || 0;
      const rCost = Number(match.refreshmentCost) || 0;
      const oCost = Number(match.otherCosts) || 0;

      reset({
        groundCost: gCost,
        umpireCost: uCost,
        ballCost: bCost,
        refreshmentCost: rCost,
        otherCosts: oCost,
        notes: match.notes || '',
      });

      // If any secondary expenses exist, show breakdown automatically
      if (uCost > 0 || bCost > 0 || rCost > 0 || oCost > 0) {
        setShowBreakdown(true);
      } else {
        setShowBreakdown(false);
      }
      setServerError(null);
    }
  }, [match, isOpen, reset]);

  const watchedGround = Number(watch('groundCost')) || 0;
  const watchedUmpire = Number(watch('umpireCost')) || 0;
  const watchedBall = Number(watch('ballCost')) || 0;
  const watchedRefresh = Number(watch('refreshmentCost')) || 0;
  const watchedOther = Number(watch('otherCosts')) || 0;

  const totalExpense =
    watchedGround + watchedUmpire + watchedBall + watchedRefresh + watchedOther;

  const onSubmit = async (values: MatchExpenseFormValues) => {
    if (!match?._id) return;
    setServerError(null);

    const ground = Number(values.groundCost) || 0;
    const umpire = Number(values.umpireCost) || 0;
    const ball = Number(values.ballCost) || 0;
    const refresh = Number(values.refreshmentCost) || 0;
    const other = Number(values.otherCosts) || 0;
    const total = ground + umpire + ball + refresh + other;

    try {
      const res = await fetchApi<{ success: boolean; match: any }>(
        `/matches/${match._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            groundCost: ground,
            umpireCost: umpire,
            ballCost: ball,
            refreshmentCost: refresh,
            otherCosts: other,
            totalMatchExpense: total,
            notes: values.notes,
          }),
        }
      );

      if (res.success) {
        showToast.success('Match fee & ground cost updated successfully.');
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to save match fee.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while saving match fee.');
    }
  };

  const opponentName = match?.opponentTeam || 'Opponent';
  const venueName = match?.venue || 'Venue';
  const matchDate = match?.matchDate ? new Date(match.matchDate).toLocaleDateString() : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="560px"
      title={`Match Fee — vs ${opponentName}`}
      subtitle="Record or update the ground fee & organizer expenses paid for this match"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            icon={<ReceiptIcon size={14} />}
          >
            Save Match Fee
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && <Alert variant="danger">{serverError}</Alert>}

        {/* Match Context Banner */}
        <div
          style={{
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12.5px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              vs {opponentName}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '11.5px', marginTop: '2px' }}>
              📍 {venueName} {matchDate ? `· 📅 ${matchDate}` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Total Match Expense
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-rose)' }}>
              {formatCurrency(totalExpense)}
            </div>
          </div>
        </div>

        {/* Primary Ground / Organizer Fee */}
        <div>
          <Input
            label="Ground / Organizer Match Fee (Rs.) *"
            type="number"
            step="100"
            min="0"
            placeholder="e.g. 10000"
            {...register('groundCost', { valueAsNumber: true })}
            autoFocus
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Fee paid to tournament organizer or ground manager to play this match.
          </div>
        </div>

        {/* Breakdown Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Additional Match Expenses (Referees, Balls, Refreshments)
          </span>
          <button
            type="button"
            onClick={() => setShowBreakdown((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: 'var(--accent-blue)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {showBreakdown ? '− Hide Breakdown' : '+ Add Other Expenses'}
          </button>
        </div>

        {showBreakdown && (
          <div
            style={{
              padding: '12px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input
                label="Umpire / Referee Fee (Rs.)"
                type="number"
                step="50"
                min="0"
                placeholder="0"
                {...register('umpireCost', { valueAsNumber: true })}
              />
              <Input
                label="Ball Cost (Rs.)"
                type="number"
                step="50"
                min="0"
                placeholder="0"
                {...register('ballCost', { valueAsNumber: true })}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <Input
                label="Refreshments / Drinks (Rs.)"
                type="number"
                step="50"
                min="0"
                placeholder="0"
                {...register('refreshmentCost', { valueAsNumber: true })}
              />
              <Input
                label="Other Miscellaneous (Rs.)"
                type="number"
                step="50"
                min="0"
                placeholder="0"
                {...register('otherCosts', { valueAsNumber: true })}
              />
            </div>
          </div>
        )}

        {/* Notes / Payment Reference */}
        <div>
          <Input
            label="Payment Notes / Reference"
            placeholder="e.g. Paid in cash to ground manager / JazzCash to tournament organizer"
            {...register('notes')}
          />
        </div>

        {/* Total Cost Summary Card */}
        <div
          style={{
            padding: '10px 14px',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '12.5px', color: '#065f46', fontWeight: 600 }}>
            Total Ground & Match Cost:
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#047857' }}>
            Rs. {formatNumber(totalExpense)}
          </div>
        </div>
      </form>
    </Modal>
  );
};

