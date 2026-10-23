'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { CreateTeamFormValues } from '../types';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  isOpen,
  onClose,
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
  } = useForm<CreateTeamFormValues>({
    defaultValues: {
      name: '',
      shortName: '',
      city: 'Karachi',
      primaryColor: '#0284c7',
      description: '',
    },
  });

  const currentColor = watch('primaryColor');

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateTeamFormValues) => {
    setServerError(null);
    try {
      const res = await fetchApi<{ success: boolean }>('/teams', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to create team.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while creating team.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Team"
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
            Save Team
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Team">
            {serverError}
          </Alert>
        )}

        <Input
          label="Team Name *"
          placeholder="e.g. Gulzar Hard Ball XI"
          {...register('name', { required: 'Team name is required' })}
          error={errors.name?.message}
        />

        <div className="grid-2">
          <Input
            label="Short Code *"
            placeholder="e.g. GHB"
            {...register('shortName', { required: 'Short code is required' })}
            error={errors.shortName?.message}
          />
          <Input
            label="City / Base"
            placeholder="e.g. Karachi"
            {...register('city')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-secondary)' }}>
            Primary Color Theme
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="color"
              value={currentColor || '#0284c7'}
              onChange={(e) => setValue('primaryColor', e.target.value)}
              style={{ width: '42px', height: '38px', padding: 0, cursor: 'pointer', borderRadius: '6px', border: '1px solid var(--border-color)' }}
            />
            <Input
              {...register('primaryColor')}
              placeholder="#0284c7"
            />
          </div>
        </div>

        <Textarea
          label="Description / Bio"
          rows={3}
          placeholder="About this team..."
          {...register('description')}
        />
      </form>
    </Modal>
  );
};
