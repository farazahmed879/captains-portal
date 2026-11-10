import {
  TrashIcon,
} from '../components/icons';
import { Badge, Button } from '../components/ui';
import { getPaymentMethodLabel, getPlayerReturnSourceLabel } from '../constants';
import { formatDate, formatNumber } from '../lib/format';
import Link from 'next/link';
import type { Column } from '../components/ui/DataTable';
import type { PlayerReturn } from '../types';

/** A player's match fees, per tournament (Player page, table view). */
export interface PlayerMatchFeeColumnsDeps {
  momAwards: any[];
  handleQuickMarkPaid: (paymentId: string, fullFee: number) => void;
  setEditingPayment: (payment: any) => void;
}

export const getPlayerMatchFeeColumns = ({ momAwards, handleQuickMarkPaid, setEditingPayment }: PlayerMatchFeeColumnsDeps): Column<any>[] => [
    {
      header: 'Match & Stage',
      width: '32%',
      render: (rec: any) => {
        const match = rec.matchId;
        const isMOM = momAwards.some((a) => a.matchId?._id === match?._id);
        return (
          <div className="cell-match-row">
            {match ? (
              <Link href={`/matches/${match._id}`} className="cell-match-link">
                <span>vs {match.opponentTeam || 'Opponent'}</span>
              </Link>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>Match</span>
            )}

            {match?.tournamentStage && match.tournamentStage !== 'regular' && (
              <span className="badge-tourney-pill" style={{ textTransform: 'capitalize' }}>
                {match.tournamentStage.replace(/_/g, ' ')}
              </span>
            )}

            {match?.teamId?.name && (
              <span className="badge-team-pill" title="Team">
                {match.teamId.shortName || match.teamId.name}
              </span>
            )}

            {isMOM && (
              <span className="badge-mom-pill" title="Man of the Match">
                MOM
              </span>
            )}

            {match?.result && (
              <span
                className={`cell-match-result ${
                  match.result === 'won' ? 'res-won' : 'res-lost'
                }`}
              >
                {match.result.toUpperCase()}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Date',
      width: '12%',
      className: 'cell-date',
      render: (rec: any) =>
        rec.matchId?.matchDate
          ? formatDate(rec.matchId.matchDate, 'N/A')
          : 'N/A',
    },
    {
      header: 'Fee Assigned',
      width: '12%',
      className: 'cell-mono',
      render: (rec: any) => `Rs. ${formatNumber(rec.feeAssigned)}`,
    },
    {
      header: 'Fee Paid',
      width: '12%',
      className: 'cell-mono cell-paid',
      render: (rec: any) => `Rs. ${formatNumber(rec.feePaid)}`,
    },
    {
      header: 'Due',
      width: '11%',
      className: 'cell-mono',
      render: (rec: any) => {
        const due = (rec.feeAssigned || 0) - (rec.feePaid || 0);
        return due > 0 ? (
          <span className="cell-due-val">Rs. {formatNumber(due)}</span>
        ) : (
          <span className="cell-zero-due">Rs. 0</span>
        );
      },
    },
    {
      header: 'Status',
      width: '10%',
      render: (rec: any) => {
        const isPaid = rec.paymentStatus === 'paid';
        return (
          <Badge
            variant={
              isPaid
                ? 'success'
                : rec.paymentStatus === 'partial'
                ? 'warning'
                : 'danger'
            }
            style={{ fontSize: '10.5px', padding: '2px 7px' }}
          >
            {rec.paymentStatus.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      width: '11%',
      align: 'right',
      render: (rec: any) => {
        const isPaid = rec.paymentStatus === 'paid';
        return (
          <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
            {!isPaid && (
              <Button
                variant="success"
                size="sm"
                onClick={() => handleQuickMarkPaid(rec._id, rec.feeAssigned)}
                title="Mark Fully Paid"
                style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
              >
                Paid
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditingPayment(rec)}
              style={{ height: '26px', padding: '0 8px', fontSize: '11px' }}
            >
              Edit
            </Button>
          </div>
        );
      },
    },
  ];

/** Money returned to a player (Player page). */
export interface PlayerReturnColumnsDeps {
  handleDeleteReturn: (returnId: string, amount?: number) => void;
}

export const getPlayerReturnColumns = ({ handleDeleteReturn }: PlayerReturnColumnsDeps): Column<PlayerReturn>[] => [
    {
      header: 'Date',
      width: '14%',
      render: (ret: any) => (
        <span style={{ fontSize: '12px' }}>
          {ret.returnDate ? formatDate(ret.returnDate, '-') : '-'}
        </span>
      ),
    },
    {
      header: 'Category / Source',
      width: '20%',
      render: (ret: any) => (
        <Badge
          variant={
            ret.source === 'winning_prize'
              ? 'warning'
              : ret.source === 'sponsorship'
              ? 'purple'
              : 'primary'
          }
          style={{ textTransform: 'capitalize', fontSize: '10.5px' }}
        >
          {getPlayerReturnSourceLabel(ret.source)}
        </Badge>
      ),
    },
    {
      header: 'Amount Returned',
      width: '16%',
      style: { fontWeight: 700, color: '#334155', fontSize: '13px' },
      render: (ret: any) => `Rs. ${formatNumber(ret.amount)}`,
    },
    {
      header: 'Method',
      width: '14%',
      render: (ret: any) => (
        <span style={{ fontSize: '11.5px' }}>
          {getPaymentMethodLabel(ret.paymentMethod)}
        </span>
      ),
    },
    {
      header: 'Tournament / Notes',
      width: '24%',
      render: (ret: any) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          {ret.tournamentId?.name ? (
            <span style={{ fontWeight: 600, color: 'var(--accent-purple)', marginRight: '6px' }}>
              [{ret.tournamentId.name}]
            </span>
          ) : null}
          {ret.notes || '-'}
        </span>
      ),
    },
    {
      header: 'Action',
      width: '12%',
      align: 'right',
      render: (ret: any) => (
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<TrashIcon size={12} />}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteReturn(ret._id, ret.amount);
          }}
          title="Delete return record"
        />
      ),
    },
  ];
