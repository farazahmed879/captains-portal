'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { TOURNAMENT_FORMAT_OPTIONS, TOURNAMENT_STATUS_OPTIONS } from '../constants';
import { CreateTournamentFormValues } from '../types';

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  onSuccess: () => void;
}

export const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTournamentFormValues>({
    defaultValues: {
      teamId: teams[0]?._id || '',
      name: '',
      format: 'Hard Ball',
      venue: '',
      entryFee: '',
      expectedWinningPrize: '',
      actualWinningPrizeWon: '',
      status: 'upcoming',
      notes: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateTournamentFormValues) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        entryFee: Number(values.entryFee) || 0,
        expectedWinningPrize: values.expectedWinningPrize === '' ? undefined : Number(values.expectedWinningPrize),
        actualWinningPrizeWon: values.actualWinningPrizeWon === '' ? undefined : Number(values.actualWinningPrizeWon),
      };

      const res = await fetchApi<{ success: boolean }>('/tournaments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to create tournament.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while creating tournament.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register Tournament or League"
      footer={
        <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          >
            Save Tournament
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Tournament">
            {serverError}
          </Alert>
        )}

        <div className="grid-2">
          <Select
            label="Participating Team *"
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            {...register('teamId', { required: 'Team is required' })}
            error={errors.teamId?.message}
          />

          <Input
            label="Tournament Name *"
            placeholder="e.g. Catchy Classic 26"
            {...register('name', { required: 'Tournament name is required' })}
            error={errors.name?.message}
          />
        </div>

        <div className="grid-2">
          <Select
            label="Format"
            options={TOURNAMENT_FORMAT_OPTIONS}
            {...register('format')}
          />

          <Input
            label="Ground Venue"
            placeholder="e.g. Landhi / Korangi Eidgah"
            {...register('venue')}
          />
        </div>

        <div className="grid-3">
          <Input
            label="Entry Fee (Rs.) *"
            type="number"
            placeholder="50000"
            {...register('entryFee', {
              required: 'Entry fee is required',
              min: { value: 0, message: 'Fee cannot be negative' },
            })}
            error={errors.entryFee?.message}
          />

          <Input
            label="Expected Winning Prize"
            type="number"
            placeholder="145000"
            {...register('expectedWinningPrize')}
          />

          <Input
            label="Actual Prize Won"
            type="number"
            placeholder="30000"
            {...register('actualWinningPrizeWon')}
          />
        </div>

        <Select
          label="Status"
          options={TOURNAMENT_STATUS_OPTIONS}
          {...register('status')}
        />

        <Textarea
          label="Notes / Remarks"
          rows={2}
          placeholder="Tournament rules, group stages, sponsor notes..."
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
