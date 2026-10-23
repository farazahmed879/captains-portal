import React from 'react';
import Link from 'next/link';
import { Column } from '../components/ui/DataTable';
import { Badge, Button } from '../components/ui';
import { ExternalLink, MapPin, Pencil, Trash2 } from '../components/icons';
import { Team } from '../types';

interface TeamColumnActions {
  onEdit: (team: Team) => void;
  onDelete: (id: string, name: string) => void;
}

export const getTeamColumns = ({
  onEdit,
  onDelete,
}: TeamColumnActions): Column<Team>[] => [
  {
    header: 'Club Code',
    width: '10%',
    render: (team: any) => (
      <Badge
        variant="purple"
        style={{
          background: team.primaryColor ? `${team.primaryColor}18` : undefined,
          color: team.primaryColor || '#0284c7',
          fontWeight: 800,
        }}
      >
        {team.shortName}
      </Badge>
    ),
  },
  {
    header: 'Team Name',
    width: '26%',
    render: (team: any) => (
      <div>
        <Link
          href={`/teams/${team._id}`}
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
          <span>{team.name}</span>
          <ExternalLink size={11} color="var(--accent-blue)" />
        </Link>
        {team.description && (
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{team.description}</div>
        )}
      </div>
    ),
  },
  {
    header: 'City / Base',
    width: '16%',
    render: (team: any) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
        <MapPin size={12} color="var(--accent-blue)" />
        <span>{team.city || 'Karachi'}</span>
      </div>
    ),
  },
  {
    header: 'Active Squad',
    width: '14%',
    style: { fontWeight: 600 },
    render: (team: any) => `${team.playerCount || 0} Players`,
  },
  {
    header: 'Matches Played',
    width: '14%',
    style: { fontWeight: 600, color: 'var(--accent-blue)' },
    render: (team: any) => `${team.matchCount || 0} Matches`,
  },
  {
    header: 'Tournaments',
    width: '12%',
    style: { fontWeight: 600, color: 'var(--accent-green)' },
    render: (team: any) => `${team.tournamentCount || 0} Leagues`,
  },
  {
    header: 'Actions',
    width: '8%',
    align: 'right',
    render: (team: any) => (
      <div className="action-group" style={{ justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          size="sm"
          isIconOnly
          onClick={() => onEdit(team)}
          title="Edit Team"
          icon={<Pencil size={14} color="var(--accent-blue)" />}
        />
        <Button
          variant="danger"
          size="sm"
          isIconOnly
          onClick={() => onDelete(team._id, team.name)}
          title="Delete Team"
          icon={<Trash2 size={14} />}
        />
      </div>
    ),
  },
];
