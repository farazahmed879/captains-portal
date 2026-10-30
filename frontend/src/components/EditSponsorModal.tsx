'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { SPONSOR_CONTRACT_OPTIONS, SPONSOR_STATUS_OPTIONS } from '../constants';

interface EditSponsorFormValues {
  teamId: string;
  tournamentId?: string;
  amountInvested: number | '';
  companyName: string;
  sponsorName: string;
  phone?: string;
  email?: string;
  contractType: string;
  status: string;
  deliverablesAgreed?: string;
  notes?: string;
}

interface EditSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: any | null;
  teams?: any[];
  tournaments?: any[];
  onSuccess: () => void;
}

export const EditSponsorModal: React.FC<EditSponsorModalProps> = ({
  isOpen,
  onClose,
  sponsor,
  teams: propTeams,
  tournaments: propTournaments,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const teamsQuery = useQuery({
    queryKey: queryKeys.teams(),
    queryFn: () => fetchApi<{ success: boolean; teams: any[] }>('/teams'),
    enabled: isOpen && (!propTeams || propTeams.length === 0),
  });
  const teams = propTeams && propTeams.length > 0 ? propTeams : (teamsQuery.data?.teams || []);

  const tournamentsQuery = useQuery({
    queryKey: queryKeys.tournaments(),
    queryFn: () => fetchApi<{ success: boolean; tournaments: any[] }>('/tournaments'),
    enabled: isOpen && (!propTournaments || propTournaments.length === 0),
  });
  const tournaments =
    propTournaments && propTournaments.length > 0
      ? propTournaments
      : (tournamentsQuery.data?.tournaments || []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditSponsorFormValues>({
    defaultValues: {
      teamId: '',
      tournamentId: '',
      amountInvested: '',
      companyName: '',
      sponsorName: '',
      phone: '',
      email: '',
      contractType: 'jersey_front',
      status: 'active',
      deliverablesAgreed: '',
      notes: '',
    },
  });

  const watchedTeamId = watch('teamId');
  const watchedTournamentId = watch('tournamentId');
  const watchedContractType = watch('contractType');
  const watchedStatus = watch('status');

  useEffect(() => {
    if (sponsor && isOpen) {
      const tourneyId = sponsor.tournamentId?._id || sponsor.tournamentId || '';
      const tmId = sponsor.teamId?._id || sponsor.teamId || '';
      reset({
        teamId: tmId,
        tournamentId: tourneyId,
        amountInvested: sponsor.amountInvested !== undefined ? sponsor.amountInvested : '',
        companyName: sponsor.companyName || '',
        sponsorName: sponsor.sponsorName || sponsor.companyName || '',
        phone: sponsor.phone || '',
        email: sponsor.email || '',
        contractType: sponsor.contractType || 'jersey_front',
        status: sponsor.status || 'active',
        deliverablesAgreed: sponsor.deliverablesAgreed || '',
        notes: sponsor.notes || '',
      });
      setServerError(null);
    }
  }, [sponsor, isOpen, reset]);

  const onSubmit = async (values: EditSponsorFormValues) => {
    if (!sponsor?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        tournamentId: values.tournamentId ? values.tournamentId : null,
        amountInvested: Number(values.amountInvested) || 0,
      };

      const res = await fetchApi<{ success: boolean; message?: string }>(`/sponsors/${sponsor._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError(res.message || 'Failed to update sponsor record.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating sponsor.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sponsor ? `Edit Sponsor: ${sponsor.companyName || sponsor.sponsorName}` : 'Edit Sponsor'}
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

        {/* Row 1: Team & Tournament */}
        <div className="grid-2">
          <Select
            label="Sponsoring Team *"
            value={watchedTeamId}
            options={teams.map((t) => ({ value: t._id, label: t.name }))}
            {...register('teamId', { required: 'Team is required' })}
            error={errors.teamId?.message}
          />

          <Select
            label="Dedicated Tournament (Optional)"
            value={watchedTournamentId}
            options={[
              { value: '', label: 'General Club Sponsor (No Tournament)' },
              ...tournaments.map((trn) => ({
                value: trn._id,
                label: `${trn.name} (${trn.format || 'Hard Ball'})`,
              })),
            ]}
            {...register('tournamentId')}
          />
        </div>

        {/* Row 2: Company & Contact Person */}
        <div className="grid-2">
          <Input
            label="Company / Brand Name *"
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

        {/* Row 3: Amount Invested & Contract Type */}
        <div className="grid-2">
          <Input
            label="Amount Invested (Rs.) *"
            type="number"
            placeholder="50000"
            {...register('amountInvested', {
              required: 'Amount invested is required',
              min: { value: 0, message: 'Amount cannot be negative' },
            })}
            error={errors.amountInvested?.message}
          />

          <Select
            label="Contract Type *"
            value={watchedContractType}
            options={SPONSOR_CONTRACT_OPTIONS}
            {...register('contractType')}
          />
        </div>

        {/* Row 4: Phone & Status */}
        <div className="grid-2">
          <Input
            label="Phone"
            placeholder="e.g. 0300-1234567"
            {...register('phone')}
          />

          <Select
            label="Status *"
            value={watchedStatus}
            options={SPONSOR_STATUS_OPTIONS}
            {...register('status')}
          />
        </div>

        {/* Row 5: Email */}
        <Input
          label="Email"
          type="email"
          placeholder="e.g. sponsor@domain.com"
          {...register('email')}
        />

        <Textarea
          label="Deliverables Agreed"
          rows={2}
          placeholder="Agreed branding and placement..."
          {...register('deliverablesAgreed')}
        />

        <Textarea
          label="Notes / Remarks"
          rows={2}
          placeholder="Any special terms or conditions..."
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
