import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import { ExternalLink, Plus, RotateCcw, Pencil, Trash2, Trophy } from '../components/icons';
import { Sponsor, SponsorTransaction } from '../types';
import { paymentMethodLabel, SponsorTxType } from '../components/SponsorTransactionModal';

interface SponsorColumnActions {
  onAddFunds: (sponsor: Sponsor) => void;
  onPayout: (sponsor: Sponsor) => void;
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (id: string, name: string) => void;
  getStatusBadgeVariant: (status?: string) => any;
  fNum: (val: number | undefined) => string;
}

export const getSponsorColumns = ({
  onAddFunds,
  onPayout,
  onEdit,
  onDelete,
  getStatusBadgeVariant,
  fNum,
}: SponsorColumnActions): Column<Sponsor>[] => [
  {
    header: 'Sponsor / Brand',
    render: (spons: any) => (
      <div>
        <Link
          href={`/sponsors/${spons._id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontWeight: 700,
            color: 'var(--text-primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>{spons.companyName || spons.sponsorName}</span>
          <ExternalLink size={11} color="var(--accent-blue)" />
        </Link>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Contact: {spons.sponsorName}
        </div>
      </div>
    ),
  },
  {
    header: 'Contract Type',
    render: (spons: any) => (
      <Badge variant="purple" style={{ textTransform: 'capitalize' }}>
        {spons.contractType?.replace(/_/g, ' ') || 'General Grant'}
      </Badge>
    ),
  },
  {
    header: 'Invested Inflow',
    style: { fontWeight: 700, color: 'var(--accent-blue)' },
    render: (spons: any) => `Rs. ${fNum(spons.amountInvested)}`,
  },
  {
    header: 'Returns Paid',
    style: { fontWeight: 600, color: 'var(--accent-rose)' },
    render: (spons: any) => `Rs. ${fNum(spons.returnsPaid)}`,
  },
  {
    header: 'Net Retained',
    style: { fontWeight: 700, color: 'var(--accent-green)' },
    render: (spons: any) => {
      const net = (spons.amountInvested || 0) - (spons.returnsPaid || 0);
      return `Rs. ${fNum(net)}`;
    },
  },
  {
    header: 'Deliverables',
    style: { fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px' },
    render: (spons: any) => spons.deliverablesAgreed || 'General sponsorship',
  },
  {
    header: 'Status',
    render: (spons: any) => (
      <Badge variant={getStatusBadgeVariant(spons.status)}>
        {spons.status?.toUpperCase() || 'ACTIVE'}
      </Badge>
    ),
  },
  {
    header: 'Actions',
    align: 'right',
    render: (spons: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
        <Button
          variant="success"
          size="sm"
          icon={<Plus size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onAddFunds(spons);
          }}
          title="Sponsor added more money"
        >
          Add Funds
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={<RotateCcw size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onPayout(spons);
          }}
          title="Record Return Payout"
        >
          Payout
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={14} color="var(--accent-blue)" />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(spons);
          }}
          title="Edit Sponsor"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(spons._id, spons.companyName || spons.sponsorName);
          }}
          title="Delete Sponsor"
        />
      </div>
    ),
  },
];

interface SponsorTxColumnActions {
  onEdit: (tx: SponsorTransaction) => void;
  onDelete: (tx: SponsorTransaction) => void;
  fNum: (val: number | undefined) => string;
}

export const getSponsorTransactionColumns = ({
  onEdit,
  onDelete,
  fNum,
}: SponsorTxColumnActions): Column<SponsorTransaction>[] => [
  {
    header: 'Date',
    width: '13%',
    render: (t: any) => (
      <div style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600 }}>{new Date(t.date).toLocaleDateString()}</div>
        {t.createdAt && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Logged {new Date(t.createdAt).toLocaleDateString()}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Type',
    width: '12%',
    render: (t: any) => {
      const isIn = t.type === 'investment';
      return (
        <Badge variant={isIn ? 'success' : 'danger'}>{isIn ? 'INVESTMENT' : 'PAYOUT'}</Badge>
      );
    },
  },
  {
    header: 'Details',
    width: '24%',
    render: (t: any) => {
      const isIn = t.type === 'investment';
      return (
        <div style={{ maxWidth: '280px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {t.notes || (isIn ? 'Sponsorship funds received' : 'Return paid to sponsor')}
          {t.tournamentId?.name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <Trophy size={11} color="var(--accent-blue)" />
              <Link href={`/tournaments/${t.tournamentId._id}`} style={{ color: 'var(--accent-blue)' }}>
                {t.tournamentId.name}
              </Link>
            </div>
          )}
        </div>
      );
    },
  },
  {
    header: 'Method / Ref',
    width: '15%',
    render: (t: any) => (
      <div style={{ fontSize: '12.5px' }}>
        <div>{paymentMethodLabel(t.method)}</div>
        {t.reference && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{t.reference}</div>
        )}
      </div>
    ),
  },
  {
    header: 'Inflow',
    width: '11%',
    align: 'right',
    style: { fontWeight: 700, color: 'var(--accent-green)' },
    render: (t: any) => (t.type === 'investment' ? `+ Rs. ${fNum(t.amount)}` : '—'),
  },
  {
    header: 'Outflow',
    width: '11%',
    align: 'right',
    style: { fontWeight: 700, color: 'var(--accent-rose)' },
    render: (t: any) => (t.type !== 'investment' ? `− Rs. ${fNum(t.amount)}` : '—'),
  },
  {
    header: 'Balance',
    width: '11%',
    align: 'right',
    render: (t: any) => (
      <span
        style={{
          fontWeight: 800,
          color: t.balance < 0 ? 'var(--accent-rose)' : 'var(--text-primary)',
        }}
      >
        Rs. {fNum(t.balance)}
      </span>
    ),
  },
  {
    header: 'Actions',
    width: '8%',
    align: 'right',
    render: (t: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={13} color="var(--accent-blue)" />}
          onClick={() => onEdit(t)}
          title="Edit Transaction"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={13} />}
          onClick={() => onDelete(t)}
          title="Delete Transaction"
        />
      </div>
    ),
  },
];
