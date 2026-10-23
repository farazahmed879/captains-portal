'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, DatePicker, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants';
import { CreateExpenseFormValues } from '../types';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: any[];
  onSuccess: () => void;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({
  isOpen,
  onClose,
  teams,
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
  } = useForm<CreateExpenseFormValues>({
    defaultValues: {
      teamId: teams[0]?._id || '',
      category: 'kit_jerseys',
      title: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const currentDate = watch('expenseDate');

  const handleClose = () => {
    reset();
    setServerError(null);
    onClose();
  };

  const onSubmit = async (values: CreateExpenseFormValues) => {
    setServerError(null);
    try {
      const payload = {
        ...values,
        amount: Number(values.amount) || 0,
      };

      const res = await fetchApi<{ success: boolean }>('/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        reset();
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to save expense.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while recording expense.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Record Team Expenditure"
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
            Save Expense
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Expense">
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
            label="Category *"
            options={EXPENSE_CATEGORY_OPTIONS}
            {...register('category')}
          />
        </div>

        <Input
          label="Title / Purpose *"
          placeholder="e.g. Practice Leather Balls (Pack of 12)"
          {...register('title', { required: 'Title is required' })}
          error={errors.title?.message}
        />

        <div className="grid-2">
          <Input
            label="Amount (Rs.) *"
            type="number"
            placeholder="5000"
            {...register('amount', {
              required: 'Amount is required',
              min: { value: 1, message: 'Amount must be greater than 0' },
            })}
            error={errors.amount?.message}
          />

          <DatePicker
            label="Date *"
            value={currentDate}
            onChange={(e) => setValue('expenseDate', e.target.value)}
          />
        </div>

        <Textarea
          label="Description / Notes"
          rows={2}
          placeholder="Receipt notes, vendor name, or specific match context..."
          {...register('description')}
        />
      </form>
    </Modal>
  );
};
