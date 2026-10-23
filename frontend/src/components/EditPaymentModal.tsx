'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Modal } from './Modal';
import { Input, Select, Button, Alert } from './ui';
import { fetchApi } from '../lib/api';
import { PAYMENT_METHOD_OPTIONS, PaymentMethod } from '../constants';
import { formatCurrency } from '../lib/format';
import { EditPaymentFormValues } from '../types';

interface EditPaymentModalProps {
  payment: any | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditPaymentModal: React.FC<EditPaymentModalProps> = ({
  payment,
  onClose,
  onSuccess,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditPaymentFormValues>({
    defaultValues: {
      feePaid: 0,
      paymentMethod: PaymentMethod.CASH,
      notes: '',
    },
  });

  useEffect(() => {
    if (payment) {
      reset({
        feePaid: payment.feePaid !== undefined ? Number(payment.feePaid) : 0,
        paymentMethod: payment.paymentMethod || PaymentMethod.CASH,
        notes: payment.notes || '',
      });
      setServerError(null);
    }
  }, [payment, reset]);

  if (!payment) return null;

  const onSubmit = async (values: EditPaymentFormValues) => {
    setServerError(null);
    try {
      const res = await fetchApi<{ success: boolean }>(`/payments/${payment._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          feePaid: Number(values.feePaid) || 0,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
          paymentDate: new Date().toISOString(),
        }),
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setServerError('Failed to update match fee payment.');
      }
    } catch (err: any) {
      setServerError(err?.message || 'Network error while updating payment.');
    }
  };

  return (
    <Modal
      isOpen={!!payment}
      onClose={onClose}
      title="Update Match Fee Record"
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
            Save Payment
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        {serverError && (
          <Alert variant="danger" title="Error Saving Payment">
            {serverError}
          </Alert>
        )}

        <Input
          label="Fee Assigned"
          type="text"
          value={formatCurrency(payment.feeAssigned || 0)}
          disabled
        />

        <Input
          label="Fee Paid (Rs.) *"
          type="number"
          placeholder="0"
          {...register('feePaid', {
            required: 'Paid amount is required',
            min: { value: 0, message: 'Fee paid cannot be negative' },
          })}
          error={errors.feePaid?.message}
        />

        <Select
          label="Payment Method"
          options={PAYMENT_METHOD_OPTIONS}
          {...register('paymentMethod')}
          error={errors.paymentMethod?.message}
        />

        <Input
          label="Receipt Note / Reference"
          placeholder="e.g. Received via JazzCash / Cash on ground"
          {...register('notes')}
          error={errors.notes?.message}
        />
      </form>
    </Modal>
  );
};
