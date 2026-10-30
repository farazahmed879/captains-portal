'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { fetchApi } from '../lib/api';
import { Button, Input, Select, Textarea, DatePicker, Modal, StatBadge, Alert } from './ui';
import { TrendingUp, TrendingDown, AlertCircleIcon } from './icons';
import { formatCurrency, formatNumber } from '../lib/format';

import {
  SponsorTxType,
  PAYMENT_METHOD_OPTIONS,
  getPaymentMethodLabel as paymentMethodLabel,
} from '../constants';

export { PAYMENT_METHOD_OPTIONS, paymentMethodLabel };
export type { SponsorTxType };

interface SponsorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: any;
  /** Pre-selected type when adding a new entry */
  defaultType?: SponsorTxType;
  /** Pass an existing ledger entry to edit it */
  transaction?: any | null;
  tournaments?: any[];
  /** Tournament pre-selected for new ledger entries (e.g. when opened from a tournament page) */
  defaultTournamentId?: string;
  onSaved: (sponsor: any) => void;
}

import { SponsorTransactionFormValues } from '../types';

export type { SponsorTransactionFormValues };

const today = () => new Date().toISOString().split('T')[0];

const getFormDefaults = (
  transaction: any | null,
  defaultType: SponsorTxType,
  defaultTournamentId = ''
): SponsorTransactionFormValues => {
  if (transaction) {
    return {
      type: (transaction.type as SponsorTxType) || defaultType,
      amount: transaction.amount ?? ('' as unknown as number),
      date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : today(),
      method: transaction.method || 'cash',
      reference: transaction.reference || '',
      tournamentId: transaction.tournamentId?._id || transaction.tournamentId || '',
      notes: transaction.notes || '',
    };
  }
  return {
    type: defaultType,
    amount: '' as unknown as number,
    date: today(),
    method: 'cash',
    reference: '',
    tournamentId: defaultTournamentId,
    notes: '',
  };
};

export const SponsorTransactionModal: React.FC<SponsorTransactionModalProps> = ({
  isOpen,
  onClose,
  sponsor,
  defaultType = 'investment',
  transaction,
  tournaments = [],
  defaultTournamentId = '',
  onSaved,
}) => {
  const isEdit = !!transaction;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SponsorTransactionFormValues>({
    defaultValues: getFormDefaults(transaction, defaultType, defaultTournamentId),
  });

  const selectedType = watch('type');
  const watchedAmount = watch('amount');
  const watchedMethod = watch('method');
  const watchedTournamentId = watch('tournamentId');

  useEffect(() => {
    if (isOpen) {
      reset(getFormDefaults(transaction, defaultType, defaultTournamentId));
    }
  }, [isOpen, transaction, defaultType, defaultTournamentId, reset]);

  if (!sponsor) return null;

  const invested = sponsor.amountInvested || 0;
  const returned = sponsor.returnsPaid || 0;
  const balance = invested - returned;

  const amt = Number(watchedAmount) || 0;
  const prevSigned = transaction ? (transaction.type === 'investment' ? 1 : -1) * (transaction.amount || 0) : 0;
  const newSigned = (selectedType === 'investment' ? 1 : -1) * amt;
  const projected = balance - prevSigned + newSigned;

  const isInvestment = selectedType === 'investment';
  const serverError = errors.root?.server?.message;

  const onSubmit = async (values: SponsorTransactionFormValues) => {
    clearErrors('root.server');
    try {
      const url = isEdit
        ? `/sponsors/${sponsor._id}/transactions/${transaction._id}`
        : `/sponsors/${sponsor._id}/transactions`;
      const res = await fetchApi<{ success: boolean; sponsor: any; message?: string }>(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify({ ...values, amount: Number(values.amount) }),
      });
      if (res.success) {
        onSaved(res.sponsor);
        onClose();
      } else {
        setError('root.server', { message: res.message || 'Failed to save transaction' });
      }
    } catch (err: any) {
      setError('root.server', { message: err?.message || 'Failed to save transaction' });
    }
  };

  const typeButton = (type: SponsorTxType, label: string, sub: string, icon: React.ReactNode) => {
    const active = selectedType === type;
    const color = type === 'investment' ? 'var(--accent-green)' : 'var(--accent-rose)';
    return (
      <button
        type="button"
        id={`sponsor-tx-type-${type}`}
        onClick={() => setValue('type', type)}
        style={{
          flex: 1,
          textAlign: 'left',
          padding: '12px 14px',
          borderRadius: '10px',
          cursor: 'pointer',
          border: `1.5px solid ${active ? color : 'var(--border-color)'}`,
          background: active ? (type === 'investment' ? 'rgba(5,150,105,0.06)' : 'rgba(225,29,72,0.06)') : '#fff',
          transition: 'all 150ms ease',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <span style={{ color }}>{icon}</span>
        <span>
          <span style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', color: 'var(--text-primary)' }}>
            {label}
          </span>
          <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--text-muted)' }}>{sub}</span>
        </span>
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Edit Ledger Entry' : 'New Ledger Entry'} – ${sponsor.companyName || sponsor.sponsorName}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
            id="sponsor-tx-save"
          >
            {isEdit ? 'Save Changes' : isInvestment ? 'Add Funds' : 'Record Payout'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="form-stack">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
          {typeButton('investment', 'Add Funds (Inflow)', 'Sponsor tops up investment', <TrendingUp size={18} />)}
          {typeButton('payout', 'Payout (Outflow)', 'Return / prize share to sponsor', <TrendingDown size={18} />)}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <StatBadge variant="primary" label="Invested" value={formatCurrency(invested)} />
          <StatBadge variant="danger" label="Returned" value={formatCurrency(returned)} />
          <StatBadge
            variant={projected < 0 ? 'danger' : 'success'}
            label="Projected Balance"
            value={formatCurrency(projected)}
          />
        </div>

        {serverError && (
          <Alert variant="danger" icon={<AlertCircleIcon size={14} />}>
            {serverError}
          </Alert>
        )}

        <div className="form-grid-2">
          <Input
            id="sponsor-tx-amount"
            label="Amount (Rs.) *"
            type="number"
            min={1}
            placeholder="e.g. 10000"
            error={errors.amount?.message}
            required
            autoFocus
            {...register('amount', {
              required: 'Please enter an amount',
              valueAsNumber: true,
              min: { value: 1, message: 'Amount must be greater than 0' },
            })}
          />
          <DatePicker
            id="sponsor-tx-date"
            label="Transaction Date *"
            error={errors.date?.message}
            required
            {...register('date', { required: 'Please select a date' })}
          />
        </div>

        <div className="form-grid-2">
          <Select
            id="sponsor-tx-method"
            label="Payment Method"
            value={watchedMethod}
            error={errors.method?.message}
            options={PAYMENT_METHOD_OPTIONS}
            {...register('method')}
          />
          <Input
            id="sponsor-tx-reference"
            label="Reference / Receipt #"
            placeholder="e.g. TRX-88213 or cheque no."
            {...register('reference')}
          />
        </div>

        {tournaments.length > 0 && (
          <Select
            id="sponsor-tx-tournament"
            label="Linked Tournament (optional)"
            value={watchedTournamentId}
            options={[{ value: '', label: '— Not linked —' }, ...tournaments.map((t) => ({ value: t._id, label: t.name }))]}
            {...register('tournamentId')}
          />
        )}

        <Textarea
          id="sponsor-tx-notes"
          label="Notes"
          rows={2}
          placeholder={
            isInvestment
              ? 'e.g. Extra funds for Catchy Classic 25 entry fee'
              : 'e.g. 20% prize share from Catchy Classic 24 win'
          }
          {...register('notes')}
        />
      </form>
    </Modal>
  );
};
