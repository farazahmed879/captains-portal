import { PencilIcon, TrashIcon } from '../components/icons';
import { Badge, Button } from '../components/ui';
import { SponsorTxType, getPaymentMethodLabel } from '../constants';
import { formatCurrency, formatDate } from '../lib/format';
import Link from 'next/link';
import type { Column } from '../components/ui/DataTable';

/** Sponsor money linked to a tournament (Tournament page). */
export interface TournamentSponsorColumnsDeps {
  findSponsor: (id: string) => any;
  openTx: (sponsor: any, type: SponsorTxType, tx?: any) => void;
  handleDeleteEntry: (entry: any) => void;
  tournament: { _id: string };
}

export const getTournamentSponsorColumns = ({ findSponsor, openTx, handleDeleteEntry, tournament }: TournamentSponsorColumnsDeps): Column<any>[] => [
    {
      header: 'Date',
      width: '12%',
      render: (e) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {formatDate(e.date)}
        </span>
      ),
    },
    {
      header: 'Sponsor',
      width: '20%',
      render: (e) => (
        <Link
          href={`/sponsors/${e.sponsorId}`}
          style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none' }}
        >
          {e.companyName || e.sponsorName}
        </Link>
      ),
    },
    {
      header: 'Type',
      width: '12%',
      render: (e) => (
        <Badge variant={e.type === 'investment' ? 'success' : 'danger'} style={{ fontSize: '9.5px', padding: '1px 5px' }}>
          {e.type === 'investment' ? 'Funds In' : 'Payout'}
        </Badge>
      ),
    },
    {
      header: 'Method / Ref',
      width: '18%',
      render: (e) => (
        <div style={{ fontSize: '11.5px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>{getPaymentMethodLabel(e.method)}</span>
          {e.reference && <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>#{e.reference}</span>}
        </div>
      ),
    },
    {
      header: 'Notes',
      width: '16%',
      render: (e) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{e.notes || '—'}</span>
      ),
    },
    {
      header: 'Amount',
      width: '11%',
      align: 'right',
      render: (e) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: '12px',
            color: e.type === 'investment' ? '#15803d' : '#dc2626',
          }}
        >
          {e.type === 'investment' ? '+' : '−'} {formatCurrency(e.amount)}
        </span>
      ),
    },
    {
      header: 'Balance',
      width: '11%',
      align: 'right',
      render: (e) => (
        <span style={{ fontWeight: 700, fontSize: '12px', color: e.balance < 0 ? '#dc2626' : '#0f172a' }}>
          {formatCurrency(e.balance)}
        </span>
      ),
    },
    {
      header: 'Actions',
      width: '10%',
      align: 'right',
      render: (e) => (
        <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            icon={<PencilIcon size={11} color="var(--accent-blue)" />}
            title="Edit entry"
            onClick={() => {
              const sponsor = findSponsor(e.sponsorId);
              if (sponsor) openTx(sponsor, e.type, { ...e, tournamentId: tournament._id });
            }}
          />
          <Button
            variant="danger"
            size="sm"
            isIconOnly
            icon={<TrashIcon size={11} />}
            title="Delete entry"
            onClick={() => handleDeleteEntry(e)}
          />
        </div>
      ),
    },
  ];
