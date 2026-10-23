'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { TOURNAMENT_FORMAT_OPTIONS, TOURNAMENT_STATUS_OPTIONS } from '../constants';
import { EditTournamentFormValues } from '../types';

interface EditTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any | null;
  onSuccess: () => void;
}

export const EditTournamentModal: React.FC<EditTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditTournamentFormValues>({
    defaultValues: {
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

  useEffect(() => {
    if (tournament && isOpen) {
      reset({
        name: tournament.name || '',
        format: tournament.format || 'Hard Ball',
        venue: tournament.venue || '',
        entryFee: tournament.entryFee !== undefined && tournament.entryFee !== null ? tournament.entryFee : '',
        expectedWinningPrize: tournament.expectedWinningPrize !== undefined && tournament.expectedWinningPrize !== null ? tournament.expectedWinningPrize : '',
        actualWinningPrizeWon: tournament.actualWinningPrizeWon !== undefined && tournament.actualWinningPrizeWon !== null ? tournament.actualWinningPrizeWon : '',
        status: tournament.status || 'upcoming',
        notes: tournament.notes || '',
      });
      setServerError(null);
    }
  }, [tournament, isOpen, reset]);

  const onSubmit = async (values: EditTournamentFormValues) => {
    if (!tournament?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        entryFee: Number(values.entryFee) || 0,
        expectedWinningPrize: values.expectedWinningPrize === '' ? undefined : Number(values.expectedWinningPrize),
        actualWinningPrizeWon: values.actualWinningPrizeWon === '' ? undefined : Number(values.actualWinningPrizeWon),
      };

      const res = await fetchApi<{ success: boolean }>(`/tournaments/${tournament._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update tournament.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating tournament.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tournament ? `Edit Tournament: ${tournament.name}` : 'Edit Tournament'}
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
            label="Tournament Name *"
            placeholder="e.g. Catchy Classic 26"
            {...register('name', { required: 'Tournament name is required' })}
            error={errors.name?.message}
          />
          <Select
            label="Format"
            options={TOURNAMENT_FORMAT_OPTIONS}
            {...register('format')}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Venue / Stadium"
            placeholder="e.g. Landhi Stadium"
            {...register('venue')}
          />
          <Select
            label="Status"
            options={TOURNAMENT_STATUS_OPTIONS}
            {...register('status')}
          />
        </div>

        <div className="grid-3">
          <Input
            label="Entry Fee (Rs.)"
            type="number"
            placeholder="50000"
            {...register('entryFee', {
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
            label="Actual Prize Won (Rs.)"
            type="number"
            placeholder="30000"
            {...register('actualWinningPrizeWon')}
          />
        </div>

        <Textarea
          label="Remarks / Notes"
          rows={2}
          placeholder="Notes or performance remarks..."
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
