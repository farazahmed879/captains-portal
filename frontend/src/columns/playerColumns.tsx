import React from 'react';
import Link from 'next/link';
import { cellMain, cellSub, cellNum, cellOneLine } from './cellStyles';
import { Column } from '../components/ui/DataTable';
import { Avatar, Button } from '../components/ui';
import { Pencil, Trash2 } from '../components/icons';
import { Player } from '../types';
import { formatNumber } from '../lib/format';

interface PlayerColumnActions {
  onCollectFee: (player: Player) => void;
  onReturn: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
}

export const getPlayerColumns = ({
  onCollectFee,
  onReturn,
  onEdit,
  onDelete,
}: PlayerColumnActions): Column<Player>[] => [
  {
    header: 'Player',
    render: (pl: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <Avatar
          name={pl.name}
          label={
            pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== ''
              ? `#${pl.jerseyNumber}`
              : undefined
          }
          size="sm"
        />
        <div style={{ minWidth: 0 }}>
          <Link
            href={`/players/${pl._id}`}
            style={{ ...cellMain, ...cellOneLine, display: 'block', textDecoration: 'none' }}
            onClick={(e) => e.stopPropagation()}
            title={pl.name}
          >
            {pl.name}
          </Link>
          <div style={{ ...cellSub, whiteSpace: 'nowrap' }}>{pl.phone || 'No phone'}</div>
        </div>
      </div>
    ),
  },
  {
    header: 'Role',
    render: (pl: any) => (
      <div style={{ whiteSpace: 'nowrap' }}>
        <div style={{ ...cellMain, fontWeight: 500, textTransform: 'capitalize' }}>
          {(pl.role || '—').replace(/_/g, ' ')}
        </div>
        <div style={{ ...cellSub, textTransform: 'capitalize' }}>{(pl.battingStyle || '').replace(/_/g, ' ')}</div>
      </div>
    ),
  },
  {
    header: 'Played',
    render: (pl: any) => (
      <div style={{ whiteSpace: 'nowrap' }}>
        <div style={{ ...cellMain, fontWeight: 500 }}>
          {pl.matchesPlayed || 0} match{pl.matchesPlayed === 1 ? '' : 'es'}
        </div>
        <div style={cellSub}>
          {pl.tournamentsCount || 0} tournament{pl.tournamentsCount === 1 ? '' : 's'}
        </div>
      </div>
    ),
  },
  {
    header: 'Fees Paid',
    align: 'right',
    render: (pl: any) => (
      <div style={cellNum}>
        <div style={cellMain}>Rs. {formatNumber(pl.totalFeePaid)}</div>
        <div style={cellSub}>of Rs. {formatNumber(pl.totalFeeAssigned)}</div>
      </div>
    ),
  },
  {
    header: 'Returned',
    align: 'right',
    render: (pl: any) => (
      <span style={{ ...cellNum, ...(pl.totalReturned ? cellMain : { color: 'var(--text-muted)' }) }}>
        {pl.totalReturned ? `Rs. ${formatNumber(pl.totalReturned)}` : '—'}
      </span>
    ),
  },
  {
    header: 'Due',
    mobile: 'summary',
    align: 'right',
    render: (pl: any) =>
      (pl.pendingDue || 0) > 0 ? (
        <span style={{ ...cellMain, ...cellNum, color: 'var(--accent-rose)' }}>Rs. {formatNumber(pl.pendingDue)}</span>
      ) : (
        <span style={{ ...cellNum, fontSize: '13px', fontWeight: 600, color: 'var(--accent-green)' }}>Cleared</span>
      ),
  },
  {
    header: 'Actions',
    align: 'right',
    render: (pl: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px', flexWrap: 'nowrap' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onCollectFee(pl);
          }}
          title="Collect / Pay Match Fee"
        >
          Pay Fee
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onReturn(pl);
          }}
          title="Return excess fee, winning prize share, or sponsor payout"
        >
          Return
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          icon={<Pencil size={13} color="var(--accent-blue)" />}
          onClick={(e) => {
            e.stopPropagation();
            onEdit(pl);
          }}
          title="Edit Player"
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          icon={<Trash2 size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(pl._id, pl.name);
          }}
          title="Deactivate Player"
        />
      </div>
    ),
  },
];
