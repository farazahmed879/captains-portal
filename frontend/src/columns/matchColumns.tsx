import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import { ExternalLink, Calendar, Users, Pencil, Trash2, CheckCircle2 } from '../components/icons';
import { Match, MatchPayment } from '../types';

interface MatchColumnActions {
  onPayments: (id: string) => void;
  onEdit: (match: Match) => void;
  onDelete: (id: string, label: string) => void;
  getResultBadgeVariant: (res?: string) => any;
  fNum: (val: number | undefined) => string;
}

export const getMatchColumns = ({
  onPayments,
  onEdit,
  onDelete,
  getResultBadgeVariant,
  fNum,
}: MatchColumnActions): Column<Match>[] => [
  {
    header: 'Match & Tournament',
    render: (m: any) => (
      <div>
        <div style={{ fontWeight: 700, fontSize: '13.5px' }}>
          {m.tournamentId?.name || (m.matchType === 'tournament' ? 'Tournament Match' : 'Friendly')}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '3px' }}>
          <Badge variant="purple" style={{ fontSize: '10px' }}>
            {m.tournamentStage || 'Match'}
          </Badge>
          <Badge variant="primary" style={{ fontSize: '10px' }}>
            {m.overs} Overs
          </Badge>
        </div>
      </div>
    ),
  },
  {
    header: 'Team vs Team',
    render: (m: any) => {
      const myTeamName = m.teamId?.name || (typeof m.teamId === 'string' ? m.teamId : 'Our Team');
      const oppName = m.opponentTeam || 'Opponent';
      return (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
              {myTeamName}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px',
                background: '#eff6ff',
                color: '#0284c7',
                border: '1px solid #bfdbfe',
                letterSpacing: '0.04em',
              }}
            >
              VS
            </span>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#0284c7' }}>
              {oppName}
            </span>
          </div>
          {m.teamId?.shortName && (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {m.teamId.shortName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    header: 'Date & Venue',
    render: (m: any) => (
      <div>
        <Link
          href={`/matches/${m._id}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            fontWeight: 700,
            color: 'var(--accent-blue)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{m.venue}</span>
          <ExternalLink size={11} />
        </Link>
        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '2px',
          }}
        >
          <Calendar size={12} />
          <span>{new Date(m.matchDate).toLocaleDateString()}</span>
        </div>
      </div>
    ),
  },
  {
    header: 'Match Costs',
    render: (m: any) => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--accent-rose)' }}>
          Rs. {fNum(m.totalMatchExpense)}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Ground: Rs. {fNum(m.groundCost)} | Ref: Rs. {fNum(m.refreshmentCost)}
        </div>
      </div>
    ),
  },
  {
    header: 'Squad Dues Status',
    render: (m: any) => (
      <div>
        <div style={{ fontWeight: 700, color: 'var(--accent-green)' }}>
          Rs. {fNum(m.totalCollected)}{' '}
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              fontWeight: 400,
            }}
          >
            / Rs. {fNum(m.totalAssigned)}
          </span>
        </div>
        <div
          style={{
            fontSize: '11px',
            color: m.pendingFee > 0 ? 'var(--accent-rose)' : 'var(--accent-green)',
          }}
        >
          {m.pendingFee > 0 ? `Rs. ${fNum(m.pendingFee)} Due` : '100% Cleared'}{' '}
          ({m.paidPlayersCount}/{m.squadPlayerIds?.length || 0} players)
        </div>
      </div>
    ),
  },
  {
    header: 'Result / MOM',
    render: (m: any) => (
      <div>
        <Badge variant={getResultBadgeVariant(m.result)}>{m.result?.toUpperCase()}</Badge>
        {m.winningPrizeMoney > 0 && (
          <div
            style={{
              fontSize: '11px',
              color: 'var(--accent-green)',
              fontWeight: 600,
              marginTop: '2px',
            }}
          >
            +Rs. {fNum(m.winningPrizeMoney)}
          </div>
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
        style={{ justifyContent: 'flex-end' }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          size="sm"
          icon={<Users size={14} />}
          onClick={() => onPayments(m._id)}
          title="Track Squad Player Fees"
        >
          Player Fee
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={14} color="var(--accent-blue)" />}
          onClick={() => onEdit(m)}
          title="Edit Match"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={14} />}
          onClick={() =>
            onDelete(m._id, `${m.tournamentId?.name || ''} - ${m.venue}`)
          }
          title="Delete Match"
        />
      </div>
    ),
  },
];

interface SquadPaymentColumnActions {
  onQuickPay: (paymentId: string, fullFee: number) => void;
  onDelete: (paymentId: string, playerName?: string) => void;
  fNum: (val: number | undefined) => string;
}

export const getMatchSquadPaymentColumns = ({
  onQuickPay,
  onDelete,
  fNum,
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
    render: (p: any) => <>Rs. {fNum(p.feeAssigned)}</>,
  },
  {
    header: 'Paid',
    render: (p: any) => (
      <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>
        Rs. {fNum(p.feePaid)}
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
            icon={<CheckCircle2 size={14} />}
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
