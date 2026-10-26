'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { PLAYER_ROLE_OPTIONS, PlayerRole } from '../constants';
import { RegisterPlayerFormValues } from '../types';

interface RegisterPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RegisterPlayerModal: React.FC<RegisterPlayerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterPlayerFormValues>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      role: PlayerRole.ALL_ROUNDER,
      jerseyNumber: '',
      notes: '',
    },
  });

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: RegisterPlayerFormValues) => {
    setServerError(null);
    try {
      const payload = {
        name: values.name,
        phone: values.phone || undefined,
        email: values.email || undefined,
        role: values.role,
        jerseyNumber: values.jerseyNumber === '' ? undefined : Number(values.jerseyNumber),
        notes: values.notes || undefined,
      };

      const res = await fetchApi<{ success: boolean }>('/players', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to register player.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while registering player.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Register New Player"
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
            Save Player
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Registration Failed">
            {serverError}
          </Alert>
        )}

        <div className="form-grid-2">
          <Input
            label="Full Name *"
            placeholder="e.g. Jawad"
            {...register('name', { required: 'Player name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="Phone / WhatsApp"
            placeholder="e.g. 0300-1234567"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="form-grid-2">
          <Select
            label="Player Role"
            options={PLAYER_ROLE_OPTIONS}
            {...register('role')}
            error={errors.role?.message}
          />
          <Input
            label="Jersey Number"
            type="number"
            placeholder="e.g. 20"
            {...register('jerseyNumber')}
            error={errors.jerseyNumber?.message}
          />
        </div>

        <Input
          label="Email Address"
          type="email"
          placeholder="player@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          label="Kit Notes / Sizes"
          placeholder="e.g. Code: JS-20 | Shirt: XL | Trouser: XL"
          {...register('notes')}
          error={errors.notes?.message}
        />
      </form>
    </Modal>
  );
};
