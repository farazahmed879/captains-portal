'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, DatePicker, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import {
  MATCH_STAGE_OPTIONS,
  MATCH_RESULT_OPTIONS,
  MATCH_TYPE_OPTIONS,
  MatchStage,
  MatchResult,
} from '../constants';
import { EditMatchFormValues } from '../types';

interface EditMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any | null;
  onSuccess: () => void;
}

export const EditMatchModal: React.FC<EditMatchModalProps> = ({
  isOpen,
  onClose,
  match,
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
  } = useForm<EditMatchFormValues>({
    defaultValues: {
      opponentTeam: '',
      venue: '',
      matchDate: new Date().toISOString().split('T')[0],
      matchType: 'tournament',
      stage: MatchStage.GROUP,
      perPlayerFee: 1000,
      totalMatchExpense: 11000,
      result: MatchResult.UPCOMING,
      notes: '',
    },
  });

  const currentDate = watch('matchDate');

  useEffect(() => {
    if (match && isOpen) {
      const formattedDate = match.matchDate
        ? new Date(match.matchDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      reset({
        opponentTeam: match.opponentTeam || '',
        venue: match.venue || '',
        matchDate: formattedDate,
        matchType: match.matchType || 'tournament',
        stage: match.stage || MatchStage.GROUP,
        perPlayerFee: match.perPlayerFee !== undefined ? match.perPlayerFee : 1000,
        totalMatchExpense: match.totalMatchExpense !== undefined ? match.totalMatchExpense : 11000,
        result: match.result || MatchResult.UPCOMING,
        notes: match.notes || '',
      });
      setServerError(null);
    }
  }, [match, isOpen, reset]);

  const onSubmit = async (values: EditMatchFormValues) => {
    if (!match?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        perPlayerFee: Number(values.perPlayerFee) || 0,
        totalMatchExpense: Number(values.totalMatchExpense) || 0,
      };

      const res = await fetchApi<{ success: boolean }>(`/matches/${match._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update match record.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating match.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={match ? `Edit Match vs ${match.opponentTeam || 'Opponent'}` : 'Edit Match'}
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

          <Select
            label="Match Result"
            options={MATCH_RESULT_OPTIONS}
            {...register('result')}
          />
        </div>

        <Textarea
          label="Match Notes / Remarks"
          rows={2}
          placeholder="Kit color, meeting time, score summary..."
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
