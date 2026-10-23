'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, DatePicker, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { MATCH_STAGE_OPTIONS, MATCH_TYPE_OPTIONS, MatchStage } from '../constants';
import { CreateMatchFormValues } from '../types';

interface CreateMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  tournaments: any[];
  onSuccess: () => void;
}

export const CreateMatchModal: React.FC<CreateMatchModalProps> = ({
  isOpen,
  onClose,
  teams,
  tournaments,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateMatchFormValues>({
    defaultValues: {
      teamId: teams[0]?._id || '',
      tournamentId: tournaments[0]?._id || '',
      opponentTeam: '',
      venue: '',
      matchDate: new Date().toISOString().split('T')[0],
      matchType: 'tournament',
      stage: MatchStage.GROUP,
      perPlayerFee: 1000,
      totalMatchExpense: 11000,
      overs: 20,
      notes: '',
    },
  });

  const currentDate = watch('matchDate');

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateMatchFormValues) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        tournamentId: values.tournamentId || undefined,
        perPlayerFee: Number(values.perPlayerFee) || 0,
        totalMatchExpense: Number(values.totalMatchExpense) || 0,
        overs: Number(values.overs) || 20,
      };

      const res = await fetchApi<{ success: boolean }>('/matches', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to create match.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while creating match.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule New Match"
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
            Save Match
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Scheduling Match">
            {serverError}
          </Alert>
        )}

        <div className="grid-2">
          <Select
            label="Team *"
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            {...register('teamId', { required: 'Team is required' })}
            error={errors.teamId?.message}
          />

          <Select
            label="Tournament / League"
            options={[
              { value: '', label: 'Select Tournament...' },
              ...tournaments.map((trn) => ({
                value: trn._id,
                label: `${trn.name} (${trn.format || 'Hard Ball'})`,
              })),
            ]}
            {...register('tournamentId')}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Opponent Team *"
            placeholder="e.g. Young Fighters CC"
            {...register('opponentTeam', { required: 'Opponent team is required' })}
            error={errors.opponentTeam?.message}
          />

          <Input
            label="Venue / Ground *"
            placeholder="e.g. Asghar Ali Shah Stadium"
            {...register('venue', { required: 'Venue is required' })}
            error={errors.venue?.message}
          />
        </div>

        <div className="grid-3">
          <DatePicker
            label="Match Date *"
            value={currentDate}
            onChange={(e) => setValue('matchDate', e.target.value)}
          />

          <Select
            label="Match Type"
            options={MATCH_TYPE_OPTIONS}
            {...register('matchType')}
          />

          <Select
            label="Stage"
            options={MATCH_STAGE_OPTIONS}
            {...register('stage')}
          />
        </div>

        <div className="grid-3">
          <Input
            label="Match Overs"
            type="number"
            placeholder="20"
            {...register('overs')}
          />

          <Input
            label="Fee per Player (Rs.) *"
            type="number"
            placeholder="1000"
            {...register('perPlayerFee', {
              required: 'Player fee is required',
              min: { value: 0, message: 'Fee cannot be negative' },
            })}
            error={errors.perPlayerFee?.message}
          />

          <Input
            label="Total Ground/Match Cost (Rs.)"
            type="number"
            placeholder="11000"
            {...register('totalMatchExpense')}
          />
        </div>

        <Textarea
          label="Match Notes / Instructions"
          rows={2}
          placeholder="Kit color, meeting time, ground rules..."
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
