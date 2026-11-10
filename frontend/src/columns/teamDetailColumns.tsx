import { Phone, Trash2 } from '../components/icons';
import { Badge, Button } from '../components/ui';
import { formatDate, formatNumber } from '../lib/format';
import Link from 'next/link';
import type { Column } from '../components/ui/DataTable';
import type { Match, Player, Tournament } from '../types';

/** A team's squad (Team page). */
export interface TeamSquadColumnsDeps {
  handleRemovePlayerFromTeam: (playerId: string, playerName: string) => void;
}

export const getTeamSquadColumns = ({ handleRemovePlayerFromTeam }: TeamSquadColumnsDeps): Column<Player>[] => [
    {
      header: 'Jersey #',
      width: '10%',
      render: (p: any) => (
        <Badge variant="purple" style={{ fontWeight: 700 }}>
          {p.jerseyNumber ? `#${p.jerseyNumber}` : '-'}
        </Badge>
      ),
    },
    {
      header: 'Player',
      mobile: 'primary',
      width: '22%',
      render: (p: any) => (
        <Link
          href={`/players/${p._id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {p.name}
        </Link>
      ),
    },
    {
      header: 'Role',
      width: '14%',
      render: (p: any) => (
        <Badge variant="secondary">
          {p.role?.replace('_', ' ').toUpperCase() || 'PLAYER'}
        </Badge>
      ),
    },
    {
      header: 'Batting Style',
      width: '15%',
      style: { textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-secondary)' },
      render: (p: any) => p.battingStyle?.replace('_', ' ') || 'Right Hand',
    },
    {
      header: 'Bowling Style',
      width: '15%',
      style: { textTransform: 'capitalize', fontSize: '12px', color: 'var(--text-secondary)' },
      render: (p: any) => p.bowlingStyle?.replace('_', ' ') || 'N/A',
    },
    {
      header: 'Phone',
      width: '12%',
      style: { fontSize: '12px', color: 'var(--text-secondary)' },
      render: (p: any) => p.phone || '-',
    },
    {
      header: 'Action',
      width: '12%',
      align: 'right',
      render: (p: any) => (
        <div className="action-group" style={{ justifyContent: 'flex-end' }}>
          <Link href={`/players/${p._id}`} passHref legacyBehavior>
            <Button variant="secondary" size="sm">
              Profile
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            isIconOnly
            title="Remove from Team Squad"
            icon={<Trash2 size={13} />}
            onClick={() => handleRemovePlayerFromTeam(p._id, p.name)}
          />
        </div>
      ),
    },
  ];

/** A team's match log (Team page). */
export const getTeamMatchColumns = (): Column<Match>[] => [
    {
      header: 'Match',
      width: '24%',
      render: (m: any) => (
        <Link
          href={`/matches/${m._id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          vs {m.opponentTeam}
        </Link>
      ),
    },
    {
      header: 'Type / League',
      width: '20%',
      render: (m: any) =>
        m.tournamentId ? (
          <Link
            href={`/tournaments/${m.tournamentId._id}`}
            style={{
              color: 'var(--accent-blue)',
              textDecoration: 'none',
              fontSize: '12px',
            }}
          >
            {m.tournamentId.name}
          </Link>
        ) : (
          <Badge variant="secondary">Friendly</Badge>
        ),
    },
    {
      header: 'Date',
      width: '14%',
      style: { fontSize: '12px', color: 'var(--text-secondary)' },
      render: (m: any) => formatDate(m.matchDate),
    },
    {
      header: 'Venue',
      width: '14%',
      style: { fontSize: '12px', color: 'var(--text-secondary)' },
      render: (m: any) => m.venue || '-',
    },
    {
      header: 'Result',
      width: '10%',
      render: (m: any) => (
        <Badge
          variant={
            m.result === 'won'
              ? 'success'
              : m.result === 'lost'
              ? 'danger'
              : 'warning'
          }
        >
          {m.result ? m.result.toUpperCase() : 'PENDING'}
        </Badge>
      ),
    },
    {
      header: 'Match Expense',
      width: '10%',
      style: { fontWeight: 600 },
      render: (m: any) => `Rs. ${formatNumber(m.totalMatchExpense)}`,
    },
    {
      header: 'Action',
      width: '8%',
      align: 'right',
      render: (m: any) => (
        <Link href={`/matches/${m._id}`} passHref legacyBehavior>
          <Button variant="secondary" size="sm">
            View Details
          </Button>
        </Link>
      ),
    },
  ];

/** A team's tournaments (Team page). */
export const getTeamTournamentColumns = (): Column<Tournament>[] => [
    {
      header: 'Tournament',
      width: '26%',
      render: (t: any) => (
        <Link
          href={`/tournaments/${t._id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {t.name}
        </Link>
      ),
    },
    {
      header: 'Format',
      width: '12%',
      render: (t: any) => <Badge variant="purple">{t.format || 'Hard Ball'}</Badge>,
    },
    {
      header: 'Venue',
      width: '16%',
      style: { fontSize: '12px', color: 'var(--text-secondary)' },
      render: (t: any) => t.venue || '-',
    },
    {
      header: 'Entry Fee',
      width: '14%',
      render: (t: any) => `Rs. ${formatNumber(t.entryFee)}`,
    },
    {
      header: 'Prize Won',
      width: '14%',
      style: { fontWeight: 600, color: 'var(--accent-green)' },
      render: (t: any) => `Rs. ${formatNumber(t.actualWinningPrizeWon)}`,
    },
    {
      header: 'Status',
      width: '10%',
      render: (t: any) => (
        <Badge
          variant={
            t.status === 'champions'
              ? 'gold'
              : t.status === 'ongoing'
              ? 'primary'
              : 'warning'
          }
        >
          {t.status?.toUpperCase() || 'COMPLETED'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      width: '8%',
      align: 'right',
      render: (t: any) => (
        <Link href={`/tournaments/${t._id}`} passHref legacyBehavior>
          <Button variant="secondary" size="sm">
            View Tournament
          </Button>
        </Link>
      ),
    },
  ];
