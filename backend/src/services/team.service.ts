import {
  teamRepository,
  playerRepository,
  matchRepository,
  tournamentRepository,
  userRepository,
} from "../repositories";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError";
import { MESSAGES } from "../constants";
import { UserRole } from "../enums";

export class TeamService {
  async getTeams(tenantId: string, _user: { id: string; role: string }) {
    const [teams, allPlayers, allMatches, allTournaments] = await Promise.all([
      teamRepository.findMany(tenantId),
      prisma.player.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, teamIds: true },
      }),
      prisma.match.findMany({
        where: { tenantId },
        select: {
          id: true,
          teamId: true,
          opponentTeam: true,
          tournamentId: true,
        },
      }),
      prisma.tournament.findMany({
        where: { tenantId },
        select: { id: true, teamId: true },
      }),
    ]);

    // Enrich each team with counts
    const enriched = teams.map((t) => {
      const resolvedTeamType =
        t.teamType === "my_team" || t.teamType === "opponent"
          ? t.teamType
          : t.name.toLowerCase().includes("gulzar")
            ? "my_team"
            : "opponent";

      const playerCount = allPlayers.filter((p) =>
        (p.teamIds || []).includes(t.id),
      ).length;

      const normalizedName = (t.name || "").trim().toLowerCase();

      const teamMatches =
        resolvedTeamType === "my_team"
          ? allMatches.filter((m) => m.teamId === t.id)
          : allMatches.filter(
              (m) =>
                m.teamId === t.id ||
                (m.opponentTeam || "").trim().toLowerCase() === normalizedName,
            );

      const matchCount = teamMatches.length;

      let tournamentCount = 0;
      if (resolvedTeamType === "my_team") {
        tournamentCount = allTournaments.filter(
          (tr) => tr.teamId === t.id,
        ).length;
      } else {
        const distinctTournamentIds = new Set(
          teamMatches.map((m) => m.tournamentId).filter(Boolean),
        );
        tournamentCount =
          distinctTournamentIds.size ||
          allTournaments.filter((tr) => tr.teamId === t.id).length;
      }

      return {
        ...t,
        _id: t.id,
        teamType: resolvedTeamType,
        playerCount,
        matchCount,
        hasPlayedMatch: matchCount > 0,
        tournamentCount,
      };
    });

    return enriched.sort((a, b) => {
      if (a.teamType === "my_team" && b.teamType !== "my_team") return -1;
      if (a.teamType !== "my_team" && b.teamType === "my_team") return 1;
      if ((b.matchCount || 0) !== (a.matchCount || 0)) {
        return (b.matchCount || 0) - (a.matchCount || 0);
      }
      return (a.name || "").localeCompare(b.name || "");
    });
  }

  async getTeamById(id: string, tenantId: string) {
    const team = await teamRepository.findById(id, tenantId);
    if (!team) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }

    const resolvedTeamType =
      team.teamType === "my_team" || team.teamType === "opponent"
        ? team.teamType
        : team.name.toLowerCase().includes("gulzar")
          ? "my_team"
          : "opponent";

    const captain = await userRepository.findById(team.captainId);
    const players = await playerRepository.findByTeam(tenantId, team.id);

    const allTenantMatches = await matchRepository.findMany(tenantId);
    const normalizedName = (team.name || "").trim().toLowerCase();
    const matches =
      resolvedTeamType === "my_team"
        ? allTenantMatches.filter((m) => m.teamId === team.id)
        : allTenantMatches.filter(
            (m) =>
              m.teamId === team.id ||
              (m.opponentTeam || "").trim().toLowerCase() === normalizedName,
          );

    const directTournaments = await tournamentRepository.findMany(tenantId, {
      teamId: team.id,
    });
    let tournaments = directTournaments;
    if (resolvedTeamType === "opponent" && matches.length > 0) {
      const matchTournamentIds = Array.from(
        new Set(
          matches.map((m) => m.tournamentId).filter((tid): tid is string => !!tid),
        ),
      );
      if (matchTournamentIds.length > 0) {
        const oppTournaments = await prisma.tournament.findMany({
          where: { tenantId, id: { in: matchTournamentIds } },
          orderBy: { startDate: "desc" },
        });
        tournaments = oppTournaments;
      }
    }

    const totalMatches = matches.length;
    const matchesWon =
      resolvedTeamType === "my_team"
        ? matches.filter((m) => m.result === "won").length
        : matches.filter((m) =>
            m.teamId === team.id ? m.result === "won" : m.result === "lost",
          ).length;
    const matchesLost =
      resolvedTeamType === "my_team"
        ? matches.filter((m) => m.result === "lost").length
        : matches.filter((m) =>
            m.teamId === team.id ? m.result === "lost" : m.result === "won",
          ).length;
    const totalMatchExpenses = matches.reduce(
      (sum, m) => sum + (m.totalMatchExpense || 0),
      0,
    );

    return {
      team: {
        ...team,
        _id: team.id,
        teamType: resolvedTeamType,
        captain: captain
          ? {
              id: captain.id,
              name: captain.name,
              email: captain.email,
              phone: captain.phone,
            }
          : null,
      },
      players: players.map((p) => ({ ...p, _id: p.id })),
      matches: matches.map((m) => ({ ...m, _id: m.id })),
      tournaments: tournaments.map((t) => ({ ...t, _id: t.id })),
      stats: {
        totalPlayers: players.length,
        totalMatches,
        matchesWon,
        matchesLost,
        winRate:
          totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0,
        totalMatchExpenses,
      },
    };
  }

  async createTeam(
    tenantId: string,
    captainId: string,
    data: {
      name: string;
      shortName: string;
      teamType?: string;
      phone?: string;
      city?: string;
      primaryColor?: string;
      description?: string;
      logo?: string;
      playerIds?: string[];
    },
  ) {
    if (!data.name || !data.shortName) {
      throw ApiError.badRequest(MESSAGES.TEAM_NAME_REQUIRED);
    }

    const { playerIds, ...teamData } = data;

    const team = await teamRepository.create({
      tenantId,
      captainId,
      ...teamData,
    });

    if (Array.isArray(playerIds) && playerIds.length > 0) {
      await this.addPlayersToTeam(team.id, tenantId, playerIds);
    }

    return {
      ...team,
      _id: team.id,
    };
  }

  async addPlayersToTeam(
    teamId: string,
    tenantId: string,
    playerIds: string[],
  ) {
    const team = await teamRepository.findById(teamId, tenantId);
    if (!team) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }

    if (!Array.isArray(playerIds) || playerIds.length === 0) {
      throw ApiError.badRequest(
        "Please select at least one player to add to the team.",
      );
    }

    const targetPlayers = await prisma.player.findMany({
      where: {
        tenantId,
        id: { in: playerIds },
      },
    });

    await Promise.all(
      targetPlayers.map((p) => {
        const updatedTeamIds = Array.from(
          new Set([...(p.teamIds || []), teamId]),
        );
        return prisma.player.update({
          where: { id: p.id },
          data: { teamIds: updatedTeamIds },
        });
      }),
    );

    return {
      addedCount: targetPlayers.length,
      message: `${targetPlayers.length} player(s) added to ${team.name}.`,
    };
  }

  async removePlayerFromTeam(
    teamId: string,
    tenantId: string,
    playerId: string,
  ) {
    const team = await teamRepository.findById(teamId, tenantId);
    if (!team) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }

    const player = await playerRepository.findById(playerId, tenantId);
    if (!player) {
      throw ApiError.notFound(MESSAGES.PLAYER_NOT_FOUND);
    }

    await prisma.player.update({
      where: { id: player.id },
      data: {
        teamIds: (player.teamIds || []).filter((tid) => tid !== teamId),
      },
    });

    return {
      message: `${player.name} removed from ${team.name}.`,
    };
  }

  async updateTeam(id: string, tenantId: string, data: any) {
    const updated = await teamRepository.update(id, tenantId, data);
    if (!updated) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }
    return {
      ...updated,
      _id: updated.id,
    };
  }

  async deleteTeam(id: string, tenantId: string) {
    const deleted = await teamRepository.delete(id, tenantId);
    if (!deleted) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }

    // Cascade delete all records belonging to this team so no orphaned stats remain
    await Promise.all([
      prisma.matchPayment.deleteMany({ where: { tenantId, teamId: id } }),
      prisma.match.deleteMany({ where: { tenantId, teamId: id } }),
      prisma.tournament.deleteMany({ where: { tenantId, teamId: id } }),
      prisma.expense.deleteMany({ where: { tenantId, teamId: id } }),
      prisma.sponsor.deleteMany({ where: { tenantId, teamId: id } }),
      prisma.playerReturn.deleteMany({ where: { tenantId, teamId: id } }),
    ]);

    // Also pull this teamId from any players who had it in teamIds
    const enrolledPlayers = await prisma.player.findMany({
      where: { tenantId, teamIds: { has: id } },
    });
    if (enrolledPlayers.length > 0) {
      await Promise.all(
        enrolledPlayers.map((p) =>
          prisma.player.update({
            where: { id: p.id },
            data: { teamIds: p.teamIds.filter((tid) => tid !== id) },
          }),
        ),
      );
    }

    return {
      message: MESSAGES.TEAM_DELETED,
    };
  }
}

export const teamService = new TeamService();
