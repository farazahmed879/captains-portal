'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, Button, Input, Select, Textarea, Card, Avatar, StatBadge, Alert } from './ui';
import { CheckCircleIcon, AlertCircleIcon } from './icons';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { formatCurrency, formatLabel } from '../lib/format';
import {
  PlayerReturnSource,
  PaymentMethod,
  PLAYER_RETURN_SOURCE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
} from '../constants';

interface PlayerReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: {
    _id: string;
    name: string;
    jerseyNumber?: number;
    role?: string;
    totalFeeAssigned?: number;
    totalFeePaid?: number;
    totalReturned?: number;
    pendingDue?: number;
  } | null;
  tournaments?: { _id: string; name: string }[];
  onSuccess: () => void;
}

import { PlayerReturnFormValues } from '../types';

const getDefaultValues = (): any => ({
  amount: '' as unknown as number,
  source: PlayerReturnSource.EXCESS_FEE_REFUND,
  paymentMethod: PaymentMethod.CASH,
  returnDate: new Date().toISOString().split('T')[0],
  tournamentId: '',
  notes: '',
});

export const PlayerReturnModal: React.FC<PlayerReturnModalProps> = ({
  isOpen,
  onClose,
  player,
  tournaments = [],
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PlayerReturnFormValues>({ defaultValues: getDefaultValues() });

  const returnMutation = useMutation({
    mutationFn: async (payload: {
      playerId: string;
      amount: number;
      source: string;
      paymentMethod: string;
      returnDate: string;
      tournamentId?: string;
      notes?: string;
    }) => {
      return await fetchApi<{ success: boolean; message?: string }>('/player-returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.playerReturns(player?._id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.players() });
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
        onSuccess();
        onClose();
      } else {
        setError('root.server', { message: res.message || 'Failed to record return' });
      }
    },
    onError: (err: any) => {
      setError('root.server', { message: err?.message || 'Error recording return to player' });
    },
  });

  // Reset the form every time the modal is opened
  useEffect(() => {
    if (isOpen) {
      reset(getDefaultValues());
      returnMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reset]);

  if (!isOpen || !player) return null;

  const onSubmit = (values: PlayerReturnFormValues) => {
    clearErrors('root.server');
    returnMutation.mutate({
      playerId: player._id,
      amount: Number(values.amount),
      source: values.source,
      paymentMethod: values.paymentMethod || 'cash',
      returnDate: values.returnDate || new Date().toISOString().split('T')[0],
      tournamentId: values.tournamentId || undefined,
      notes: values.notes ? values.notes.trim() : undefined,
    });
  };

  const loading = returnMutation.isPending;
  const serverError = errors.root?.server?.message;

  const tournamentOptions = [
    { value: '', label: 'None / General Team Return' },
    ...tournaments.map((t) => ({ value: t._id, label: t.name })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Return / Payout Money to Player"
      subtitle={`Issue fee refund, tournament prize share, or sponsor payout to ${player.name}`}
      maxWidth="560px"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {/* Player Snapshot */}
        <Card hoverable={false} className="player-snapshot">
          <div className="player-snapshot-identity">
            <Avatar
              name={player.name}
              label={player.jerseyNumber ? `#${player.jerseyNumber}` : undefined}
            />
            <div>
              <div className="player-snapshot-name">{player.name}</div>
              <div className="player-snapshot-role">{formatLabel(player.role) || 'Player'}</div>
            </div>
          </div>

          <div className="player-snapshot-stats">
            <StatBadge variant="secondary" label="Assigned" value={formatCurrency(player.totalFeeAssigned)} />
            <StatBadge variant="success" label="Paid" value={formatCurrency(player.totalFeePaid)} />
            <StatBadge variant="warning" label="Returned" value={formatCurrency(player.totalReturned)} />
          </div>
        </Card>

        {serverError && (
          <Alert variant="danger" icon={<AlertCircleIcon size={14} />}>
            {serverError}
          </Alert>
        )}

        <div className="form-grid-2">
          <Input
            label="Return Amount (Rs.)"
            type="number"
            placeholder="e.g. 1500"
            error={errors.amount?.message}
            required
            autoFocus
            {...register('amount', {
              required: 'Please enter a return amount',
              valueAsNumber: true,
              min: { value: 1, message: 'Amount must be greater than 0' },
            })}
          />

          <Select
            label="Return Source / Category"
            error={errors.source?.message}
            options={PLAYER_RETURN_SOURCE_OPTIONS}
            required
            {...register('source', { required: 'Please select a source' })}
          />
        </div>

        <div className="form-grid-2">
          <Select
            label="Payment Method"
            error={errors.paymentMethod?.message}
            options={PAYMENT_METHOD_OPTIONS}
            required
            {...register('paymentMethod', { required: 'Please select a payment method' })}
          />

          <Input
            label="Return Date"
            type="date"
            error={errors.returnDate?.message}
            required
            {...register('returnDate', { required: 'Please select a date' })}
          />
        </div>

        {tournaments.length > 0 && (
          <Select
            label="Linked Tournament (Optional)"
            options={tournamentOptions}
            {...register('tournamentId')}
          />
        )}

        <Textarea
          label="Notes / Reference Details (Optional)"
          rows={2}
          placeholder="e.g. Team won final prize money of Rs. 30,000; returned Rs. 1,500 share to player."
          {...register('notes')}
        />

        <div className="form-actions">
          <Button variant="secondary" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="success"
            type="submit"
            loading={loading}
            icon={<CheckCircleIcon size={14} />}
          >
            {loading ? 'Processing...' : 'Confirm Return'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
