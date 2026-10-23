import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Avatar, Badge, Button } from '../components/ui';
import { ExternalLink, CheckCircle2, DollarIcon, Pencil, Trash2 } from '../components/icons';
import { Player } from '../types';

interface PlayerColumnActions {
  onCollectFee: (player: Player) => void;
  onReturn: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (id: string, name: string) => void;
  fNum: (val: number | undefined) => string;
}

export const getPlayerColumns = ({
  onCollectFee,
  onReturn,
  onEdit,
  onDelete,
  fNum,
}: PlayerColumnActions): Column<Player>[] => [
  {
    header: 'Player & Jersey',
    width: '26%',
    render: (pl: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
        <Avatar
          name={pl.name}
          label={
            pl.jerseyNumber !== undefined && pl.jerseyNumber !== null && pl.jerseyNumber !== ''
              ? `#${pl.jerseyNumber}`
              : undefined
          }
          size="sm"
        />
        <div>
          <Link
            href={`/players/${pl._id}`}
            style={{
              fontWeight: 700,
              color: 'var(--text-primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span>{pl.name}</span>
            <ExternalLink size={10} color="var(--accent-blue)" />
          </Link>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
            {pl.phone ? pl.phone : pl.notes || 'Squad Member'}
          </div>
        </div>
      </div>
    ),
  },
  {
    header: 'Role & Style',
    width: '14%',
    render: (pl: any) => (
      <>
        <Badge variant="primary" style={{ textTransform: 'capitalize', fontSize: '10.5px' }}>
          {pl.role?.replace('_', ' ')}
        </Badge>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {pl.battingStyle?.replace('_', ' ')}
        </div>
      </>
    ),
  },
  {
    header: 'Matches & Tourneys',
    width: '14%',
    render: (pl: any) => (
      <>
        <div style={{ fontWeight: 700, fontSize: '13px' }}>{pl.matchesPlayed || 0} matches</div>
        <div style={{ fontSize: '10.5px', color: 'var(--accent-purple)', fontWeight: 600 }}>
          {pl.tournamentsCount || 0} tournaments
        </div>
      </>
    ),
  },
  {
    header: 'Fee Assigned / Paid',
    width: '15%',
    render: (pl: any) => (
      <>
        <div style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '12.5px' }}>
          Paid: Rs. {fNum(pl.totalFeePaid)}
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
          Assigned: Rs. {fNum(pl.totalFeeAssigned)}
        </div>
      </>
    ),
  },
  {
    header: 'Returned',
    width: '11%',
    render: (pl: any) =>
      (pl.totalReturned || 0) > 0 ? (
        <Badge variant="warning" style={{ fontSize: '11px' }}>
          Rs. {fNum(pl.totalReturned)}
        </Badge>
      ) : (
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>-</span>
      ),
  },
  {
    header: 'Remaining Due',
    width: '10%',
    render: (pl: any) =>
      (pl.pendingDue || 0) > 0 ? (
        <span className="cell-due-val" style={{ fontSize: '11.5px', padding: '1px 6px' }}>
          Rs. {fNum(pl.pendingDue)} Due
        </span>
      ) : (
        <Badge variant="success" icon={<CheckCircle2 size={10} />} style={{ fontSize: '10.5px' }}>
          Cleared
        </Badge>
      ),
  },
  {
    header: 'Actions',
    width: '10%',
    align: 'right',
    render: (pl: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end', gap: '4px' }}>
        <Button
          variant="success"
          size="sm"
          icon={<DollarIcon size={13} />}
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
          icon={<DollarIcon size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onReturn(pl);
          }}
          style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309', fontWeight: 700 }}
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
