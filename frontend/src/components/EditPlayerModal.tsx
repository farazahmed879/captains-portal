'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import {
  PLAYER_ROLE_OPTIONS,
  BATTING_STYLE_OPTIONS,
  BOWLING_STYLE_OPTIONS,
  PlayerRole,
} from '../constants';
import { EditPlayerFormValues } from '../types';

interface EditPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: any;
  onSuccess: () => void;
}

export const EditPlayerModal: React.FC<EditPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPlayerFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      jerseyNumber: '',
      role: PlayerRole.ALL_ROUNDER,
      battingStyle: 'right_hand',
      bowlingStyle: 'right_arm_medium',
      kitSizeChest: '',
      kitSizeTrouser: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (player && isOpen) {
      reset({
        name: player.name || '',
        phone: player.phone || '',
        email: player.email || '',
        jerseyNumber: player.jerseyNumber !== undefined && player.jerseyNumber !== null ? player.jerseyNumber : '',
        role: player.role || PlayerRole.ALL_ROUNDER,
        battingStyle: player.battingStyle || 'right_hand',
        bowlingStyle: player.bowlingStyle || 'right_arm_medium',
        kitSizeChest: player.kitSizeChest || '',
        kitSizeTrouser: player.kitSizeTrouser || '',
        notes: player.notes || '',
      });
      setServerError(null);
    }
  }, [player, isOpen, reset]);

  const onSubmit = async (values: EditPlayerFormValues) => {
    if (!player?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        jerseyNumber: values.jerseyNumber === '' ? undefined : Number(values.jerseyNumber),
      };
      const res = await fetchApi<{ success: boolean }>(`/players/${player._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update player profile.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating player.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={player ? `Edit Player: ${player.name}` : 'Edit Player'}
      footer={
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Changes">
            {serverError}
          </Alert>
        )}

        <div className="grid-2">
          <Input
            label="Player Name *"
            placeholder="Full Name"
            {...register('name', { required: 'Player name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 03001234567"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Email Address"
            type="email"
            placeholder="player@example.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Jersey Number"
            type="number"
            placeholder="e.g. 7"
            {...register('jerseyNumber')}
            error={errors.jerseyNumber?.message}
          />
        </div>

        <div className="grid-3">
          <Select
            label="Role"
            options={PLAYER_ROLE_OPTIONS}
            {...register('role')}
            error={errors.role?.message}
          />
          <Select
            label="Batting Style"
            options={BATTING_STYLE_OPTIONS}
            {...register('battingStyle')}
            error={errors.battingStyle?.message}
          />
          <Select
            label="Bowling Style"
            options={BOWLING_STYLE_OPTIONS}
            {...register('bowlingStyle')}
            error={errors.bowlingStyle?.message}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Kit Size: Chest"
            placeholder="e.g. M, L, 40"
            {...register('kitSizeChest')}
            error={errors.kitSizeChest?.message}
          />
          <Input
            label="Kit Size: Trouser"
            placeholder="e.g. 32, 34, L"
            {...register('kitSizeTrouser')}
            error={errors.kitSizeTrouser?.message}
          />
        </div>

        <Textarea
          label="Notes / Special Instructions"
          rows={2}
          placeholder="Add kit, medical, or tournament notes..."
          {...register('notes')}
          error={errors.notes?.message}
        />
      </form>
    </Modal>
  );
};
