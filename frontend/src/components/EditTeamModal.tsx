'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Input, Select, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { queryKeys } from '../lib/queryKeys';
import { EditTeamFormValues } from '../types';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: any | null;
  onSuccess: () => void;
}

export const EditTeamModal: React.FC<EditTeamModalProps> = ({
  isOpen,
  onClose,
  team,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const playersQuery = useQuery({
    queryKey: queryKeys.players(),
    queryFn: () => fetchApi<{ success: boolean; players: any[] }>('/players'),
    enabled: isOpen,
  });

  const playersWithPhone = (playersQuery.data?.players || []).filter((p: any) => p.phone);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditTeamFormValues>({
    defaultValues: {
      name: '',
      shortName: '',
      teamType: 'my_team',
      phone: '',
      city: 'Karachi',
      primaryColor: '#0284c7',
      description: '',
    },
  });

  const currentColor = watch('primaryColor');

  useEffect(() => {
    if (team && isOpen) {
      reset({
        name: team.name || '',
        shortName: team.shortName || '',
        teamType: team.teamType || (team.name?.toLowerCase().includes('gulzar') ? 'my_team' : 'opponent'),
        phone: team.phone || '',
        city: team.city || 'Karachi',
        primaryColor: team.primaryColor || '#0284c7',
        description: team.description || '',
      });
      setServerError(null);
    }
  }, [team, isOpen, reset]);

  const onSubmit = async (values: EditTeamFormValues) => {
    if (!team?._id) return;
    setServerError(null);
    try {
      const res = await fetchApi<{ success: boolean }>(`/teams/${team._id}`, {
        method: 'PUT',
        body: JSON.stringify(values),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update team.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating team.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={team ? `Edit Team: ${team.name}` : 'Edit Team'}
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
            label="Team Name *"
            placeholder="e.g. Gulzar Hard Ball XI"
            {...register('name', { required: 'Team name is required' })}
            error={errors.name?.message}
          />
          <Select
            label="Team Category *"
            {...register('teamType')}
            options={[
              { value: 'my_team', label: 'My Club Team' },
              { value: 'opponent', label: 'Opponent Team' },
            ]}
          />
        </div>

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

        <div className="grid-2">
          <div>
            <Input
              label="Team / Captain Phone Number"
              placeholder="e.g. 0342-2181946"
              list="edit-team-phone-options"
              {...register('phone')}
            />
            <datalist id="edit-team-phone-options">
              {playersWithPhone.map((p: any) => (
                <option key={p._id || p.id} value={p.phone}>
                  {p.name} ({p.phone})
                </option>
              ))}
            </datalist>
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
