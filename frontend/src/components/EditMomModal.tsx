'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Button, Alert } from './ui';
import { Award, Trophy, DollarSign } from 'lucide-react';
import { fetchApi } from '../lib/api';
import { showToast } from '../lib/alerts';
import { formatCurrency } from '../lib/format';

interface EditMomFormValues {
  momPlayerId: string;
  momPrizeMoney: number | '';
  momAwardDetails: string;
}

interface EditMomModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: any | null;
  players?: any[];
  onSuccess: () => void;
}

export const EditMomModal: React.FC<EditMomModalProps> = ({
  isOpen,
  onClose,
  match,
  players = [],
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<EditMomFormValues>({
    defaultValues: {
      momPlayerId: '',
      momPrizeMoney: 0,
      momAwardDetails: '',
    },
  });

  const selectedMomId = watch('momPlayerId');
  const watchedPrize = Number(watch('momPrizeMoney')) || 0;

  useEffect(() => {
    if (match && isOpen) {
      const currentMomId = match.momPlayerId?._id || match.momPlayerId || '';
      reset({
        momPlayerId: String(currentMomId),
        momPrizeMoney: Number(match.momPrizeMoney) || 0,
        momAwardDetails: match.momAwardDetails || '',
      });
      setServerError(null);
    }
  }, [match, isOpen, reset]);

  const onSubmit = async (values: EditMomFormValues) => {
    if (!match?._id) return;
    setServerError(null);

    const momPlayerId = values.momPlayerId && values.momPlayerId !== 'none' ? values.momPlayerId : null;
    const momPrizeMoney = Number(values.momPrizeMoney) || 0;
    const momAwardDetails = values.momAwardDetails || '';

    try {
      const res = await fetchApi<{ success: boolean; match: any }>(
        `/matches/${match._id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            momPlayerId,
            momPrizeMoney,
            momAwardDetails,
          }),
        }
      );

      if (res.success) {
        showToast.success('Man of the Match & Organizer Prize Money updated.');
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to save Man of the Match.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while saving Man of the Match.');
    }
  };

  const opponentName = match?.opponentTeam || 'Opponent';
  const playerOptions = [
    { value: '', label: 'None (No MOM Awarded)' },
    ...players.map((p) => ({
      value: p._id,
      label: `${p.name}${p.jerseyNumber ? ` (#${p.jerseyNumber})` : ''} · ${p.role?.replace('_', ' ') || 'Player'}`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="500px"
      title={`Man of the Match — vs ${opponentName}`}
      subtitle="Organizer Man of the Match (MOM) cash prize & player award"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            icon={<Award size={14} />}
          >
            Save MOM Award
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && <Alert variant="danger">{serverError}</Alert>}

        {/* Highlight Card */}
        <div
          style={{
            padding: '12px 14px',
            background: '#fef3c7',
            border: '1px solid #fde68a',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trophy size={20} color="#d97706" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400e' }}>
              Organizer MOM Cash Prize
            </div>
            <div style={{ fontSize: '11.5px', color: '#b45309', marginTop: '2px' }}>
              Cash prize awarded to the best player by the tournament organizers.
            </div>
          </div>
        </div>

        {/* MOM Player Dropdown */}
        <Select
          label="Man of the Match Player *"
          placeholder="Select MOM player..."
          searchable
          searchPlaceholder="Search player by name or jersey..."
          value={selectedMomId}
          onChange={(e) => setValue('momPlayerId', e.target.value)}
          options={playerOptions}
        />

        {/* MOM Prize Money */}
        <div>
          <Input
            label="MOM Cash Prize (Rs.) *"
            type="number"
            step="100"
            min="0"
            placeholder="e.g. 2000"
            {...register('momPrizeMoney', { valueAsNumber: true })}
            autoFocus
          />
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Enter cash prize given by the organizer (e.g. Rs. 1,000, Rs. 2,000, Rs. 5,000).
          </div>
        </div>

        {/* Performance Details */}
        <div>
          <Input
            label="Award Details / Match Performance"
            placeholder="e.g. 54* off 28 balls & 3/18 (4 ov)"
            {...register('momAwardDetails')}
          />
        </div>

        {/* Live Preview Box */}
        {selectedMomId && (
          <div
            style={{
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12.5px',
            }}
          >
            <div style={{ color: '#166534', fontWeight: 600 }}>
              MOM Prize Awarded:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#15803d' }}>
              Rs. {formatCurrency(watchedPrize)}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

