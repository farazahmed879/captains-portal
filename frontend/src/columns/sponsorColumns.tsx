import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import {
  Pencil,
  Trash2,
} from '../components/icons';
import { Sponsor, SponsorTransaction } from '../types';
import { paymentMethodLabel } from '../components/SponsorTransactionModal';
import { formatDate, formatNumber } from '../lib/format';
import { cellMain, cellSub, cellNum, cellOneLine } from './cellStyles';
import { getSponsorStatusVariant } from '../constants/badgeVariants';

interface SponsorColumnActions {
  onAddFunds: (sponsor: Sponsor) => void;
  onPayout: (sponsor: Sponsor) => void;
  onEdit: (sponsor: Sponsor) => void;
  onDelete: (id: string, name: string) => void;
}

export const getSponsorColumns = ({
  onAddFunds,
  onPayout,
  onEdit,
  onDelete,
}: SponsorColumnActions): Column<Sponsor>[] => [
  {
    header: 'Sponsor',
    render: (spons: any) => (
      <div style={{ minWidth: 0 }}>
        <Link
          href={`/sponsors/${spons._id}`}
          onClick={(e) => e.stopPropagation()}
          style={{ ...cellMain, ...cellOneLine, display: 'block', textDecoration: 'none' }}
          title={spons.companyName || spons.sponsorName}
        >
          {spons.companyName || spons.sponsorName}
        </Link>
        <div style={{ ...cellSub, whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
          {(spons.contractType || 'general_grant').replace(/_/g, ' ')}
        </div>
      </div>
    ),
  },
  {
    header: 'Invested',
    align: 'right',
    render: (spons: any) => (
      <span style={{ ...cellMain, ...cellNum }}>Rs. {formatNumber(spons.amountInvested)}</span>
    ),
  },
  {
    header: 'Paid Back',
    align: 'right',
    render: (spons: any) => (
      <span style={{ ...cellNum, ...(spons.returnsPaid ? cellMain : { color: 'var(--text-muted)' }) }}>
        {spons.returnsPaid ? `Rs. ${formatNumber(spons.returnsPaid)}` : '—'}
      </span>
    ),
  },
  {
    header: 'Net Retained',
    mobile: 'summary',
    align: 'right',
    render: (spons: any) => {
      const net = (spons.amountInvested || 0) - (spons.returnsPaid || 0);
      return <span style={{ ...cellMain, ...cellNum }}>Rs. {formatNumber(net)}</span>;
    },
  },
  {
    header: 'Status',
    render: (spons: any) => (
      <Badge variant={getSponsorStatusVariant(spons.status)}>{spons.status || 'active'}</Badge>
    ),
  },
  {
    header: 'Actions',
    align: 'right',
    render: (spons: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
        <Button
          variant="secondary"
          size="sm"
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
}

export const getSponsorTransactionColumns = ({
  onEdit,
  onDelete,
}: SponsorTxColumnActions): Column<SponsorTransaction>[] => [
  {
    header: 'Date',
    width: '13%',
    render: (t: any) => (
      <div style={{ whiteSpace: 'nowrap' }}>
        <div style={{ fontWeight: 600 }}>{formatDate(t.date)}</div>
        {t.createdAt && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Logged {formatDate(t.createdAt)}
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
    render: (t: any) => (t.type === 'investment' ? `+ Rs. ${formatNumber(t.amount)}` : '—'),
  },
  {
    header: 'Outflow',
    width: '11%',
    align: 'right',
    style: { fontWeight: 700, color: 'var(--accent-rose)' },
    render: (t: any) => (t.type !== 'investment' ? `− Rs. ${formatNumber(t.amount)}` : '—'),
  },
  {
    header: 'Balance',
    width: '11%',
    align: 'right',
    render: (t: any) => (
      <span
        style={{
          fontWeight: 700,
          color: t.balance < 0 ? 'var(--accent-rose)' : 'var(--text-primary)',
        }}
      >
        Rs. {formatNumber(t.balance)}
      </span>
    ),
  },
  {
    header: 'Actions',
    width: '8%',
    align: 'right',
    render: (t: any) => (
      <div
        className="action-group"
        style={{ justifyContent: 'flex-end' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={13} color="var(--accent-blue)" />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(t);
          }}
          title="Edit Transaction"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(t);
          }}
          title="Delete Transaction"
        />
      </div>
    ),
  },
];
