'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input, Select, Button, Alert } from './ui';
import { Plus, CheckCircle2 } from './icons';
import { fetchApi } from '../lib/api';
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from '../constants';
import { AssignSquadFeeFormValues } from '../types';

interface AssignSquadFeeFormProps {
  matchId: string;
  defaultFee?: number;
  players: any[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AssignSquadFeeForm: React.FC<AssignSquadFeeFormProps> = ({
  matchId,
  defaultFee = 1000,
  players,
  onSuccess,
  onCancel,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignSquadFeeFormValues>({
    defaultValues: {
      playerId: '',
      feeAssigned: defaultFee,
      feePaid: defaultFee,
      paymentMethod: PaymentMethod.CASH,
    },
  });

  const onSubmit = async (values: AssignSquadFeeFormValues) => {
    if (!matchId || !values.playerId) return;
    setServerError(null);

    try {
      const res = await fetchApi<{ success: boolean; payment: any }>('/payments', {
        method: 'POST',
        body: JSON.stringify({
          matchId,
          playerId: values.playerId,
          feeAssigned: Number(values.feeAssigned) || 0,
          feePaid: Number(values.feePaid) || 0,
          paymentMethod: values.paymentMethod,
        }),
      });

      if (res.success) {
        reset({
          playerId: '',
          feeAssigned: defaultFee,
          feePaid: defaultFee,
          paymentMethod: PaymentMethod.CASH,
        });
        onSuccess();
      } else {
        setServerError('Failed to assign squad match fee.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Error recording squad fee payment.');
    }
  };

  const playerOptions = [
    { value: '', label: 'Select Player...' },
    ...players.map((p) => ({
      value: p._id,
      label: `${p.name} ${p.jerseyNumber ? `(#${p.jerseyNumber})` : ''}`,
    })),
  ];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
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

      {serverError && (
        <Alert variant="danger" title="Error">
          {serverError}
        </Alert>
      )}

      <div className="grid-3" style={{ marginBottom: '12px' }}>
        <Select
          label="Select Player *"
          options={playerOptions}
          {...register('playerId', { required: 'Please select a player' })}
          error={errors.playerId?.message}
        />

        <Input
          label="Fee Assigned (Rs.) *"
          type="number"
          {...register('feeAssigned', { required: 'Assigned fee required' })}
          error={errors.feeAssigned?.message}
        />

        <Input
          label="Fee Paid (Rs.) *"
          type="number"
          {...register('feePaid', { required: 'Paid fee required' })}
          error={errors.feePaid?.message}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button variant="secondary" size="sm" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="success"
          size="sm"
          type="submit"
          icon={<CheckCircle2 size={14} />}
          loading={isSubmitting}
        >
          Save Player Fee
        </Button>
      </div>
    </form>
  );
};
