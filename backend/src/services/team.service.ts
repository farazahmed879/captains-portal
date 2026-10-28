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
  async getTeams(tenantId: string, user: { id: string; role: string }) {
    const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
    let teams = [];

    if (isSuperAdmin) {
      teams = await teamRepository.findMany(tenantId);
    } else {
      // Find all team IDs where this user is enrolled as a player
      const currentUser = await userRepository.findById(user.id);
      let enrolledTeamIds: string[] = [];

      if (currentUser?.playerId) {
        const player = await playerRepository.findById(currentUser.playerId);
        if (player?.teamIds) {
          enrolledTeamIds.push(...player.teamIds);
        }
      }

      // Also check matching player by phone, email, or name
      const matchingPlayer = await playerRepository.findByMatchingCriteria(
        tenantId,
        {
          phone: currentUser?.phone || undefined,
          email: currentUser?.email,
          name: currentUser?.name,
        },
      );

      if (matchingPlayer?.teamIds) {
        enrolledTeamIds.push(...matchingPlayer.teamIds);
      }

      // Remove duplicates
      enrolledTeamIds = Array.from(new Set(enrolledTeamIds));

      teams = await teamRepository.findByCaptainOrEnrolled(
        tenantId,
        user.id,
        enrolledTeamIds,
      );
    }

    // Enrich each team with counts
    const enriched = await Promise.all(
      teams.map(async (t) => {
        const playerCount = await playerRepository.count(tenantId, {
          teamIds: { has: t.id },
          isActive: true,
        });
        const matchCount = await matchRepository.count(tenantId, {
          teamId: t.id,
        });
        const tournamentCount = await tournamentRepository.count(tenantId, {
          teamId: t.id,
        });

        return {
          ...t,
          _id: t.id,
          teamType:
            t.teamType ||
            (t.name.toLowerCase().includes("gulzar") ? "my_team" : "opponent"),
          playerCount,
          matchCount,
          tournamentCount,
        };
      }),
    );

    return enriched.sort((a, b) => {
      if (a.teamType === "my_team" && b.teamType !== "my_team") return -1;
      if (a.teamType !== "my_team" && b.teamType === "my_team") return 1;
      return 0;
    });
  }

  async getTeamById(id: string, tenantId: string) {
    const team = await teamRepository.findById(id, tenantId);
    if (!team) {
      throw ApiError.notFound(MESSAGES.TEAM_NOT_FOUND);
    }

    const captain = await userRepository.findById(team.captainId);
    const players = await playerRepository.findByTeam(tenantId, team.id);
    const matches = await matchRepository.findMany(tenantId, {
      teamId: team.id,
    });
    const tournaments = await tournamentRepository.findMany(tenantId, {
      teamId: team.id,
    });

    const totalMatches = matches.length;
    const matchesWon = matches.filter((m) => m.result === "won").length;
    const matchesLost = matches.filter((m) => m.result === "lost").length;
    const totalMatchExpenses = matches.reduce(
      (sum, m) => sum + (m.totalMatchExpense || 0),
      0,
    );

    return {
      team: {
        ...team,
        _id: team.id,
        teamType:
          team.teamType ||
          (team.name.toLowerCase().includes("gulzar") ? "my_team" : "opponent"),
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
