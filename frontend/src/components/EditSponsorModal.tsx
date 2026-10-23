'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { SPONSOR_CONTRACT_OPTIONS, SPONSOR_STATUS_OPTIONS } from '../constants';
import { EditSponsorFormValues } from '../types';

interface EditSponsorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: any | null;
  onSuccess: () => void;
}

export const EditSponsorModal: React.FC<EditSponsorModalProps> = ({
  isOpen,
  onClose,
  sponsor,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSponsorFormValues>({
    defaultValues: {
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

  useEffect(() => {
    if (sponsor && isOpen) {
      reset({
        companyName: sponsor.companyName || '',
        sponsorName: sponsor.sponsorName || '',
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
      const res = await fetchApi<{ success: boolean }>(`/sponsors/${sponsor._id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update sponsor record.');
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

        <div className="grid-2">
          <Input
            label="Company / Brand Name *"
            placeholder="e.g. SipNest"
            {...register('companyName', { required: 'Company name is required' })}
            error={errors.companyName?.message}
          />

          <Input
            label="Contact Person"
            placeholder="e.g. Director"
            {...register('sponsorName')}
          />
        </div>

        <div className="grid-2">
          <Input
            label="Phone"
            placeholder="e.g. 0300-1234567"
            {...register('phone')}
          />
          <Input
            label="Email"
            type="email"
            placeholder="e.g. sponsor@domain.com"
            {...register('email')}
          />
        </div>

        <div className="grid-2">
          <Select
            label="Contract Type"
            options={SPONSOR_CONTRACT_OPTIONS}
            {...register('contractType')}
          />
          <Select
            label="Status"
            options={SPONSOR_STATUS_OPTIONS}
            {...register('status')}
          />
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Note: To record additional investment or payout, use the <strong>Add Funds</strong> or <strong>Payout</strong> ledger button.
        </div>

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
