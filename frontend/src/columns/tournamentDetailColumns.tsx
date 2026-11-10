import {
  TrashIcon,
} from '../components/icons';
import { Badge, Button } from '../components/ui';
import { getMatchResultVariant } from '../constants/badgeVariants';
import { formatDate, formatNumber } from '../lib/format';
import Link from 'next/link';
import type { Column } from '../components/ui/DataTable';
import { cellMain, cellNum, cellOneLine, cellSub } from './cellStyles';

const oneLine = { ...cellOneLine, maxWidth: '180px' };
import type { Expense, Match } from '../types';

/** A tournament's matches (Tournament page). */
export interface TournamentMatchColumnsDeps {
  handleOpenMatchExpense: (match: any) => void;
  handleOpenMatchFees: (match: any) => void;
}

export const getTournamentMatchColumns = ({ handleOpenMatchExpense, handleOpenMatchFees }: TournamentMatchColumnsDeps): Column<Match>[] => [
    {
      header: 'Match',
      render: (m: any) => (
        <div>
          <div style={{ ...cellMain, whiteSpace: 'nowrap' }}>vs {m.opponentTeam || 'Opponent'}</div>
          <div style={{ ...cellSub, textTransform: 'capitalize' }}>
            {(m.tournamentStage || m.stage || 'group').replace(/_/g, ' ')} stage
          </div>
        </div>
      ),
    },
    {
      header: 'Date & Venue',
      render: (m: any) => (
        <div>
          <div style={{ ...cellMain, fontWeight: 500, ...oneLine }} title={m.venue || ''}>
            {m.venue || '—'}
          </div>
          <div style={cellSub}>{formatDate(m.matchDate)}</div>
        </div>
      ),
    },
    {
      header: 'Ground Cost',
      align: 'right',
      render: (m: any) => (
        <span style={{ ...cellMain, ...cellNum }}>Rs. {formatNumber(m.totalMatchExpense || 0)}</span>
      ),
    },
    {
      header: 'Squad Fees',
      align: 'right',
      render: (m: any) => {
        const collected = m.totalCollected || 0;
        const assigned = m.totalAssigned || 0;
        const pending = m.pendingFee || Math.max(0, assigned - collected);
        return (
          <div style={cellNum}>
            <div style={cellMain}>Rs. {formatNumber(collected)}</div>
            <div style={{ ...cellSub, color: pending > 0 ? '#dc2626' : cellSub.color }}>
              {assigned === 0
                ? 'No fees set'
                : pending > 0
                ? `Rs. ${formatNumber(pending)} due`
                : `of Rs. ${formatNumber(assigned)}`}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Match P/L',
      mobile: 'summary',
      align: 'right',
      render: (m: any) => {
        const collected = m.totalCollected || 0;
        const prize = (m.momPrizeMoney || 0) + (m.winningPrizeMoney || 0);
        const pnl = collected + prize - (m.totalMatchExpense || m.groundCost || 0);
        return (
          <div style={cellNum}>
            <div
              style={{
                ...cellMain,
                color: pnl > 0 ? '#15803d' : pnl < 0 ? '#dc2626' : 'var(--text-muted)',
              }}
            >
              {pnl > 0 ? '+' : pnl < 0 ? '−' : ''}Rs. {formatNumber(Math.abs(pnl))}
            </div>
            {prize > 0 && <div style={cellSub}>incl. prize Rs. {formatNumber(prize)}</div>}
          </div>
        );
      },
    },
    {
      header: 'Result',
      render: (m: any) => (
        <div>
          <Badge variant={getMatchResultVariant(m.result)}>{m.result || 'upcoming'}</Badge>
          {m.momPlayerId && (
            <div style={{ ...cellSub, whiteSpace: 'nowrap' }}>MOM: {m.momPlayerId?.name || '—'}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (m: any) => {
        const pending = m.pendingFee || Math.max(0, (m.totalAssigned || 0) - (m.totalCollected || 0));
        return (
          <div className="action-group" style={{ justifyContent: 'flex-end', gap: '5px', flexWrap: 'nowrap' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMatchExpense(m);
              }}
              title="Record / Edit Match & Ground Fee Paid to Organizer"
              style={{ height: '28px', padding: '0 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
            >
              <span>Match Fee</span>
            </Button>
            <Button
              variant={pending > 0 ? 'primary' : 'secondary'}
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenMatchFees(m);
              }}
              title="Manage player fee collection, record payments & clear dues"
              style={{ height: '28px', padding: '0 8px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
            >
              <span>Player Fee</span>
            </Button>
            <Link href={`/matches/${m._id}`} passHref legacyBehavior>
              <Button
                variant="secondary"
                size="sm"
                style={{ height: '28px', padding: '0 8px', fontSize: '11.5px' }}
              >
                Profile
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

/** A tournament's extra payments (Tournament page). */
export interface TournamentExtraPaymentColumnsDeps {
  handleDeleteExtraPayment: (expenseId: string, title: string) => void;
}

export const getTournamentExtraPaymentColumns = ({ handleDeleteExtraPayment }: TournamentExtraPaymentColumnsDeps): Column<Expense>[] => [
    {
      header: 'Payment Title / Purpose',
      width: '35%',
      render: (e: any) => (
        <div>
          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{e.title}</div>
          {e.description && (
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{e.description}</div>
          )}
        </div>
      ),
    },
    {
      header: 'Date',
      width: '20%',
      render: (e: any) => formatDate(e.expenseDate || e.createdAt),
    },
    {
      header: 'Amount Paid',
      width: '25%',
      style: { fontWeight: 700, fontSize: '13px', color: 'var(--accent-rose)' },
      render: (e: any) => `Rs. ${formatNumber(e.amount)}`,
    },
    {
      header: 'Actions',
      width: '20%',
      align: 'right',
      render: (e: any) => (
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<TrashIcon size={13} />}
          onClick={() => handleDeleteExtraPayment(e._id, e.title)}
          title="Delete extra payment"
        />
      ),
    },
  ];
