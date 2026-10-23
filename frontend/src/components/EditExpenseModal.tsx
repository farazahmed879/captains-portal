'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, DatePicker, Textarea, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { EXPENSE_CATEGORY_OPTIONS } from '../constants';
import { EditExpenseFormValues } from '../types';

interface EditExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: any | null;
  onSuccess: () => void;
}

export const EditExpenseModal: React.FC<EditExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
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
  } = useForm<EditExpenseFormValues>({
    defaultValues: {
      title: '',
      category: 'kit_jerseys',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      description: '',
    },
  });

  const currentDate = watch('expenseDate');

  useEffect(() => {
    if (expense && isOpen) {
      const formattedDate = expense.expenseDate
        ? new Date(expense.expenseDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      reset({
        title: expense.title || '',
        category: expense.category || 'kit_jerseys',
        amount: expense.amount !== undefined ? expense.amount : '',
        expenseDate: formattedDate,
        description: expense.description || '',
      });
      setServerError(null);
    }
  }, [expense, isOpen, reset]);

  const onSubmit = async (values: EditExpenseFormValues) => {
    if (!expense?._id) return;
    setServerError(null);
    try {
      const payload = {
        ...values,
        amount: Number(values.amount) || 0,
      };

      const res = await fetchApi<{ success: boolean }>(`/expenses/${expense._id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update expense record.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating expense.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expense ? `Edit Expense: ${expense.title}` : 'Edit Expense'}
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
            label="Title *"
            placeholder="e.g. Practice Leather Balls"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />
          <Select
            label="Category"
            options={EXPENSE_CATEGORY_OPTIONS}
            {...register('category')}
          />
        </div>

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
            label="Date"
            value={currentDate}
            onChange={(e) => setValue('expenseDate', e.target.value)}
          />
        </div>

        <Textarea
          label="Description / Notes"
          rows={2}
          placeholder="Receipt notes, vendor name..."
          {...register('description')}
        />
      </form>
    </Modal>
  );
};
