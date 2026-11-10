import { Button } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/format';
import type { Column } from '../components/ui/DataTable';

/** A player's match fees (Pay Fee dialog). */
export interface PendingMatchFeeColumnsDeps {
  handleQuickPayMatch: (paymentId: string, fullFee: number) => void;
}

export const getPendingMatchFeeColumns = ({ handleQuickPayMatch }: PendingMatchFeeColumnsDeps): Column<any>[] => [
    {
      header: 'Match / Venue',
      render: (rec) => {
        const match = rec.matchId;
        return (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              vs {match?.opponentTeam || 'Opponent'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {match?.venue || 'Venue'} • {match?.matchDate ? formatDate(match.matchDate, '') : ''}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Assigned',
      render: (rec) => formatCurrency(rec.feeAssigned),
    },
    {
      header: 'Paid',
      render: (rec) => (
        <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
          {formatCurrency(rec.feePaid)}
        </span>
      ),
    },
    {
      header: 'Balance',
      render: (rec) => {
        const bal = (rec.feeAssigned || 0) - (rec.feePaid || 0);
        return (
          <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
            {formatCurrency(bal)}
          </span>
        );
      },
    },
    {
      header: 'Action',
      align: 'right',
      render: (rec) => (
        <Button
          variant="success"
          size="sm"
          onClick={() => handleQuickPayMatch(rec._id, rec.feeAssigned)}
          title="Mark Cleared"
        >
          Mark Paid
        </Button>
      ),
    },
  ];
