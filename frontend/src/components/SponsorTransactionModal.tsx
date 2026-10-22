'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../lib/api';
import { Button, Input, Select, Textarea, DatePicker, Modal } from './ui';
import { TrendingUp, TrendingDown } from './icons';

export type SponsorTxType = 'investment' | 'payout';

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'easypaisa', label: 'Easypaisa' },
  { value: 'jazzcash', label: 'JazzCash' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export const paymentMethodLabel = (m?: string) =>
  PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label || 'Cash';

interface SponsorTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sponsor: any;
  /** Pre-selected type when adding a new entry */
  defaultType?: SponsorTxType;
  /** Pass an existing ledger entry to edit it */
  transaction?: any | null;
  tournaments?: any[];
  onSaved: (sponsor: any) => void;
}

const today = () => new Date().toISOString().split('T')[0];

export const SponsorTransactionModal: React.FC<SponsorTransactionModalProps> = ({
  isOpen,
  onClose,
  sponsor,
  defaultType = 'investment',
  transaction,
  tournaments = [],
  onSaved,
}) => {
  const isEdit = !!transaction;
  const [form, setForm] = useState({
    type: defaultType as SponsorTxType,
    amount: '',
    date: today(),
    method: 'cash',
    reference: '',
    tournamentId: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (transaction) {
      setForm({
        type: transaction.type,
        amount: String(transaction.amount ?? ''),
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : today(),
        method: transaction.method || 'cash',
        reference: transaction.reference || '',
        tournamentId: transaction.tournamentId?._id || transaction.tournamentId || '',
        notes: transaction.notes || '',
      });
    } else {
      setForm({
        type: defaultType,
        amount: '',
        date: today(),
        method: 'cash',
        reference: '',
        tournamentId: '',
        notes: '',
      });
    }
  }, [isOpen, transaction, defaultType]);

  if (!sponsor) return null;

  const invested = sponsor.amountInvested || 0;
  const returned = sponsor.returnsPaid || 0;
  const balance = invested - returned;

  // Projected balance after this entry (accounts for the entry being edited)
  const amt = Number(form.amount) || 0;
  const prevSigned = transaction ? (transaction.type === 'investment' ? 1 : -1) * (transaction.amount || 0) : 0;
  const newSigned = (form.type === 'investment' ? 1 : -1) * amt;
  const projected = balance - prevSigned + newSigned;

  const fNum = (v: number) => v.toLocaleString('en-US');
  const isInvestment = form.type === 'investment';
  const accent = isInvestment ? 'var(--accent-green)' : 'var(--accent-rose)';

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!amt || amt <= 0) {
      setError('Please enter an amount greater than 0');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = isEdit
        ? `/sponsors/${sponsor._id}/transactions/${transaction._id}`
        : `/sponsors/${sponsor._id}/transactions`;
      const res = await fetchApi<{ success: boolean; sponsor: any; message?: string }>(url, {
        method: isEdit ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, amount: amt }),
      });
      if (res.success) {
        onSaved(res.sponsor);
        onClose();
      } else {
        setError(res.message || 'Failed to save transaction');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const typeButton = (type: SponsorTxType, label: string, sub: string, icon: React.ReactNode) => {
    const active = form.type === type;
    const color = type === 'investment' ? 'var(--accent-green)' : 'var(--accent-rose)';
    return (
      <button
        type="button"
        id={`sponsor-tx-type-${type}`}
        onClick={() => setForm({ ...form, type })}
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
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => handleSubmit()} loading={saving} id="sponsor-tx-save">
            {isEdit ? 'Save Changes' : isInvestment ? 'Add Funds' : 'Record Payout'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          {typeButton('investment', 'Add Funds (Inflow)', 'Sponsor tops up investment', <TrendingUp size={18} />)}
          {typeButton('payout', 'Payout (Outflow)', 'Return / prize share to sponsor', <TrendingDown size={18} />)}
        </div>

        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            background: '#f8fafc',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          <div>
            Invested
            <div style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>Rs. {fNum(invested)}</div>
          </div>
          <div>
            Returned
            <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>Rs. {fNum(returned)}</div>
          </div>
          <div>
            Balance after entry
            <div style={{ fontWeight: 800, color: projected < 0 ? 'var(--accent-rose)' : 'var(--accent-green)' }}>
              Rs. {fNum(projected)}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <Input
            id="sponsor-tx-amount"
            label="Amount (Rs.) *"
            type="number"
            min={1}
            placeholder="e.g. 10000"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
            autoFocus
            style={{ fontWeight: 700, color: accent }}
          />
          <DatePicker
            id="sponsor-tx-date"
            label="Transaction Date *"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>

        <div className="grid-2">
          <Select
            id="sponsor-tx-method"
            label="Payment Method"
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <Input
            id="sponsor-tx-reference"
            label="Reference / Receipt #"
            placeholder="e.g. TRX-88213 or cheque no."
            value={form.reference}
            onChange={(e) => setForm({ ...form, reference: e.target.value })}
          />
        </div>

        {tournaments.length > 0 && (
          <Select
            id="sponsor-tx-tournament"
            label="Linked Tournament (optional)"
            value={form.tournamentId}
            onChange={(e) => setForm({ ...form, tournamentId: e.target.value })}
            options={[{ value: '', label: '— Not linked —' }, ...tournaments.map((t) => ({ value: t._id, label: t.name }))]}
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
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />

        {error && (
          <div style={{ color: 'var(--accent-rose)', fontSize: '12.5px', marginTop: '4px' }}>{error}</div>
        )}
      </form>
    </Modal>
  );
};
