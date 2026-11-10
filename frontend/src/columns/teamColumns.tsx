import { cellMain, cellNum, cellOneLine, cellSub } from './cellStyles';
import {
  Pencil,
  Phone,
  Trash2,
} from '../components/icons';
import { Button } from '../components/ui';
import Link from 'next/link';
import type { Column } from '../components/ui/DataTable';
import type { Team } from '../types';

/** Teams list (Teams page). */
export interface TeamColumnsDeps {
  getTeamType: (team: any) => 'my_team' | 'opponent';
  hasPlayedAgainstMyTeam: (team: any) => boolean;
  setManagingSquadTeam: (team: any) => void;
  handleEditOpen: (team: any) => void;
  handleDelete: (id: string, name: string) => void;
}

export const getTeamColumns = ({ getTeamType, hasPlayedAgainstMyTeam, setManagingSquadTeam, handleEditOpen, handleDelete }: TeamColumnsDeps): Column<Team>[] => [
    {
      header: "Team",
      render: (team: any) => {
        const isMyTeam = getTeamType(team) === "my_team";
        const kind = isMyTeam
          ? "My team"
          : hasPlayedAgainstMyTeam(team)
            ? "Opponent"
            : "Team";
        return (
          <div style={{ minWidth: 0 }}>
            <Link
              href={`/teams/${team._id}`}
              style={{ ...cellMain, ...cellOneLine, display: "block", textDecoration: "none" }}
              title={team.name}
            >
              {team.name}
            </Link>
            <div style={{ ...cellSub, whiteSpace: "nowrap" }}>
              {[team.shortName, kind].filter(Boolean).join(" · ")}
            </div>
          </div>
        );
      },
    },
    {
      header: "Phone",
      render: (team: any) => (
        <span style={{ whiteSpace: "nowrap", color: team.phone ? "var(--text-secondary)" : "var(--text-muted)" }}>
          {team.phone || "—"}
        </span>
      ),
    },
    {
      header: "City",
      render: (team: any) => (
        <span style={{ whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
          {team.city || "—"}
        </span>
      ),
    },
    {
      header: "Players",
      align: "right",
      render: (team: any) => (
        <span style={{ ...cellMain, ...cellNum }}>{team.playerCount || 0}</span>
      ),
    },
    {
      header: "Matches",
      align: "right",
      render: (team: any) => (
        <span style={{ ...cellMain, ...cellNum }}>{team.matchCount || 0}</span>
      ),
    },
    {
      header: "Tournaments",
      align: "right",
      render: (team: any) => (
        <span style={{ ...cellMain, ...cellNum }}>{team.tournamentCount || 0}</span>
      ),
    },
    {
      header: "Actions",
      align: "right",
      render: (team: any) => (
        <div
          className="action-group"
          style={{ justifyContent: "flex-end" }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setManagingSquadTeam(team);
            }}
            title="Add Players to Team"
          >
            <span>+ Players</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isIconOnly
            onClick={(e) => {
              e.stopPropagation();
              handleEditOpen(team);
            }}
            title="Edit Team"
            icon={<Pencil size={14} color="var(--accent-blue)" />}
          />
          <Button
            variant="danger"
            size="sm"
            isIconOnly
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(team._id, team.name);
            }}
            title="Delete Team"
            icon={<Trash2 size={14} />}
          />
        </div>
      ),
    },
  ];
