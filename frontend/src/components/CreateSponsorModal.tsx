'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { SPONSOR_CONTRACT_OPTIONS, PAYMENT_METHOD_OPTIONS } from '../constants';
import { CreateSponsorFormValues } from '../types';

interface CreateSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  onSuccess: () => void;
  /** When provided, the new sponsor is dedicated to this tournament */
  tournament?: { _id: string; name: string; teamId?: any } | null;
}

export const CreateSponsorModal: React.FC<CreateSponsorModalProps> = ({
  isOpen,
  onClose,
  teams,
  onSuccess,
  tournament = null,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);
  const tournamentTeamId = tournament?.teamId?._id || tournament?.teamId || '';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateSponsorFormValues & { paymentMethod: string }>({
    defaultValues: {
      teamId: tournamentTeamId || teams[0]?._id || '',
      contractType: tournament ? 'tournament_banner' : 'jersey_front',
      companyName: '',
      sponsorName: '',
      amountInvested: '',
      deliverablesAgreed: '',
      paymentMethod: 'cash',
    },
  });

  // Keep team in sync when teams load asynchronously
  useEffect(() => {
    if (isOpen) {
      setValue('teamId', tournamentTeamId || teams[0]?._id || '');
    }
  }, [isOpen, tournamentTeamId, teams, setValue]);

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateSponsorFormValues & { paymentMethod: string }) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        tournamentId: tournament?._id || undefined,
        amountInvested: Number(values.amountInvested) || 0,
        investmentDate: new Date().toISOString(),
      };

      const res = await fetchApi<{ success: boolean }>('/sponsors', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to create sponsor record.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while creating sponsor.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={tournament ? `New Sponsor — ${tournament.name}` : 'Register Brand Sponsor'}
      subtitle={tournament ? 'This sponsor will be dedicated to this tournament' : undefined}
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
            Save Sponsor
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Sponsor">
            {serverError}
          </Alert>
        )}

        <div className="grid-2">
          <Select
            label="Sponsoring Team *"
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            {...register('teamId', { required: 'Team is required' })}
            error={errors.teamId?.message}
          />

          <Select
            label="Contract Type *"
            options={SPONSOR_CONTRACT_OPTIONS}
            {...register('contractType')}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Brand / Company Name *"
            placeholder="e.g. SipNest"
            {...register('companyName', { required: 'Company name is required' })}
            error={errors.companyName?.message}
          />

          <Input
            label="Contact Person *"
            placeholder="e.g. Director / Marketing Head"
            {...register('sponsorName', { required: 'Contact person is required' })}
            error={errors.sponsorName?.message}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Amount Invested (Rs.) *"
            type="number"
            placeholder="50000"
            {...register('amountInvested', {
              required: 'Amount invested is required',
              min: { value: 1, message: 'Amount must be greater than 0' },
            })}
            error={errors.amountInvested?.message}
          />

          <Select
            label="Payment Method"
            options={PAYMENT_METHOD_OPTIONS}
            {...register('paymentMethod')}
          />
        </div>

        <Textarea
          label="Deliverables Agreed"
          rows={2}
          placeholder="e.g. Front chest branding on playing shirts"
          {...register('deliverablesAgreed')}
        />
      </form>
    </Modal>
  );
};
