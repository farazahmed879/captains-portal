import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import {
  Pencil,
  Trash2,
} from '../components/icons';
import { Match, MatchPayment } from '../types';
import { formatDate, formatNumber } from '../lib/format';
import { cellMain, cellSub, cellNum, cellOneLine, signedColor } from './cellStyles';
import { getMatchResultVariant } from '../constants/badgeVariants';

interface MatchColumnActions {
  onPayments: (id: string) => void;
  onEdit: (match: Match) => void;
  onDelete: (id: string, label: string) => void;
}

export const getMatchColumns = ({
  onPayments,
  onEdit,
  onDelete,
}: MatchColumnActions): Column<Match>[] => [
  {
    header: 'Match',
    render: (m: any) => {
      const context = [
        m.tournamentId?.name || (m.matchType === 'tournament' ? 'Tournament' : 'Friendly'),
        m.tournamentStage ? String(m.tournamentStage).replace(/_/g, ' ') : null,
        m.teamId?.shortName || null,
      ]
        .filter(Boolean)
        .join(' · ');
      return (
        <div>
          <Link
            href={`/matches/${m._id}`}
            onClick={(e) => e.stopPropagation()}
            style={{ ...cellMain, ...cellOneLine, display: 'block', textDecoration: 'none' }}
            title={`vs ${m.opponentTeam || 'Opponent'}`}
          >
            vs {m.opponentTeam || 'Opponent'}
          </Link>
          <div style={{ ...cellSub, ...cellOneLine, textTransform: 'capitalize' }} title={context}>
            {context}
          </div>
        </div>
      );
    },
  },
  {
    header: 'Date & Venue',
    render: (m: any) => (
      <div>
        <div style={{ ...cellMain, fontWeight: 500, ...cellOneLine, maxWidth: '170px' }} title={m.venue || ''}>
          {m.venue || '—'}
        </div>
        <div style={cellSub}>{formatDate(m.matchDate)}</div>
      </div>
    ),
  },
  {
    header: 'Match Cost',
    align: 'right',
    render: (m: any) => (
      <span style={{ ...cellMain, ...cellNum }}>Rs. {formatNumber(m.totalMatchExpense || 0)}</span>
    ),
  },
  {
    header: 'Squad Fees',
    align: 'right',
    render: (m: any) => {
      const assigned = m.totalAssigned || 0;
      const pending = m.pendingFee || 0;
      const squad = m.squadPlayerIds?.length || 0;
      return (
        <div style={cellNum} title={`${m.paidPlayersCount || 0} of ${squad} players paid`}>
          <div style={cellMain}>Rs. {formatNumber(m.totalCollected || 0)}</div>
          <div style={{ ...cellSub, color: pending > 0 ? 'var(--accent-rose)' : cellSub.color }}>
            {assigned === 0 ? 'No fees set' : pending > 0 ? `Rs. ${formatNumber(pending)} due` : `of Rs. ${formatNumber(assigned)}`}
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
      const prize = (m.momPrizeMoney || 0) + (m.winningPrizeMoney || 0);
      const pnl = (m.totalCollected || 0) + prize - (m.totalMatchExpense || m.groundCost || 0);
      return (
        <div style={cellNum}>
          <div style={{ ...cellMain, color: signedColor(pnl) }}>
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
        {m.momPlayerId?.name && (
          <div style={{ ...cellSub, whiteSpace: 'nowrap' }}>MOM: {m.momPlayerId.name}</div>
        )}
      </div>
    ),
  },
  {
    header: 'Actions',
    align: 'right',
    render: (m: any) => (
      <div
        className="action-group"
        style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button variant="secondary" size="sm" onClick={() => onPayments(m._id)} title="Track Squad Player Fees">
          Player Fee
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={14} />}
          onClick={() => onEdit(m)}
          title="Edit Match"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={14} />}
          onClick={() => onDelete(m._id, `${m.tournamentId?.name || ''} - ${m.venue}`)}
          title="Delete Match"
        />
      </div>
    ),
  },
];

interface SquadPaymentColumnActions {
  onQuickPay: (paymentId: string, fullFee: number) => void;
  onDelete: (paymentId: string, playerName?: string) => void;
}

export const getMatchSquadPaymentColumns = ({
  onQuickPay,
  onDelete,
}: SquadPaymentColumnActions): Column<MatchPayment>[] => [
  {
    header: 'Player',
    render: (p: any) => (
      <div>
        <div style={{ fontWeight: 600 }}>{p.playerId?.name || 'Player'}</div>
        {p.playerId?.jerseyNumber && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            #{p.playerId.jerseyNumber}
          </div>
        )}
      </div>
    ),
  },
  {
    header: 'Assigned',
    render: (p: any) => <>Rs. {formatNumber(p.feeAssigned)}</>,
  },
  {
    header: 'Paid',
    render: (p: any) => (
      <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
        Rs. {formatNumber(p.feePaid)}
      </span>
    ),
  },
  {
    header: 'Status',
    render: (p: any) => (
      <Badge
        variant={
          p.paymentStatus === 'paid'
            ? 'success'
            : p.paymentStatus === 'partial'
            ? 'warning'
            : 'danger'
        }
      >
        {p.paymentStatus}
      </Badge>
    ),
  },
  {
    header: 'Action',
    align: 'right',
    render: (p: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
        {p.paymentStatus !== 'paid' && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onQuickPay(p._id, p.feeAssigned)}
            title="Mark as Paid"
          >
            Mark Paid
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={14} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(p._id, p.playerId?.name);
          }}
          title="Remove player from match"
        />
      </div>
    ),
  },
];
