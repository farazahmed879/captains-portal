"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamService = exports.TeamService = void 0;
const repositories_1 = require("../repositories");
const prisma_1 = require("../config/prisma");
const apiError_1 = require("../utils/apiError");
const constants_1 = require("../constants");
class TeamService {
    async getTeams(tenantId, _user) {
        const [teams, allPlayers, allMatches, allTournaments] = await Promise.all([
            repositories_1.teamRepository.findMany(tenantId),
            prisma_1.prisma.player.findMany({
                where: { tenantId, isActive: true },
                select: { id: true, teamIds: true },
            }),
            prisma_1.prisma.match.findMany({
                where: { tenantId },
                select: {
                    id: true,
                    teamId: true,
                    opponentTeam: true,
                    tournamentId: true,
                },
            }),
            prisma_1.prisma.tournament.findMany({
                where: { tenantId },
                select: { id: true, teamId: true },
            }),
        ]);
        // Enrich each team with counts
        const enriched = teams.map((t) => {
            const resolvedTeamType = t.teamType === "my_team" || t.teamType === "opponent"
                ? t.teamType
                : t.name.toLowerCase().includes("gulzar")
                    ? "my_team"
                    : "opponent";
            const playerCount = allPlayers.filter((p) => (p.teamIds || []).includes(t.id)).length;
            const normalizedName = (t.name || "").trim().toLowerCase();
            const teamMatches = resolvedTeamType === "my_team"
                ? allMatches.filter((m) => m.teamId === t.id)
                : allMatches.filter((m) => m.teamId === t.id ||
                    (m.opponentTeam || "").trim().toLowerCase() === normalizedName);
            const matchCount = teamMatches.length;
            let tournamentCount = 0;
            if (resolvedTeamType === "my_team") {
                tournamentCount = allTournaments.filter((tr) => tr.teamId === t.id).length;
            }
            else {
                const distinctTournamentIds = new Set(teamMatches.map((m) => m.tournamentId).filter(Boolean));
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
            if (a.teamType === "my_team" && b.teamType !== "my_team")
                return -1;
            if (a.teamType !== "my_team" && b.teamType === "my_team")
                return 1;
            if ((b.matchCount || 0) !== (a.matchCount || 0)) {
                return (b.matchCount || 0) - (a.matchCount || 0);
            }
            return (a.name || "").localeCompare(b.name || "");
        });
    }
    async getTeamById(id, tenantId) {
        const team = await repositories_1.teamRepository.findById(id, tenantId);
        if (!team) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.TEAM_NOT_FOUND);
        }
        const resolvedTeamType = team.teamType === "my_team" || team.teamType === "opponent"
            ? team.teamType
            : team.name.toLowerCase().includes("gulzar")
                ? "my_team"
                : "opponent";
        const captain = team.captainId ? await repositories_1.userRepository.findById(team.captainId) : null;
        const players = await repositories_1.playerRepository.findByTeam(tenantId, team.id);
        const allTenantMatches = await repositories_1.matchRepository.findMany(tenantId);
        const normalizedName = (team.name || "").trim().toLowerCase();
        const matches = resolvedTeamType === "my_team"
            ? allTenantMatches.filter((m) => m.teamId === team.id)
            : allTenantMatches.filter((m) => m.teamId === team.id ||
                (m.opponentTeam || "").trim().toLowerCase() === normalizedName);
        const directTournaments = await repositories_1.tournamentRepository.findMany(tenantId, {
            teamId: team.id,
        });
        let tournaments = directTournaments;
        if (resolvedTeamType === "opponent" && matches.length > 0) {
            const matchTournamentIds = Array.from(new Set(matches.map((m) => m.tournamentId).filter((tid) => !!tid)));
            if (matchTournamentIds.length > 0) {
                const oppTournaments = await prisma_1.prisma.tournament.findMany({
                    where: { tenantId, id: { in: matchTournamentIds } },
                    orderBy: { startDate: "desc" },
                });
                tournaments = oppTournaments;
            }
        }
        const totalMatches = matches.length;
        const matchesWon = resolvedTeamType === "my_team"
            ? matches.filter((m) => m.result === "won").length
            : matches.filter((m) => m.teamId === team.id ? m.result === "won" : m.result === "lost").length;
        const matchesLost = resolvedTeamType === "my_team"
            ? matches.filter((m) => m.result === "lost").length
            : matches.filter((m) => m.teamId === team.id ? m.result === "lost" : m.result === "won").length;
        const totalMatchExpenses = matches.reduce((sum, m) => sum + (m.totalMatchExpense || 0), 0);
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
                winRate: totalMatches > 0 ? Math.round((matchesWon / totalMatches) * 100) : 0,
                totalMatchExpenses,
            },
        };
    }
    async createTeam(tenantId, captainId, data) {
        if (!data.name || !data.shortName) {
            throw apiError_1.ApiError.badRequest(constants_1.MESSAGES.TEAM_NAME_REQUIRED);
        }
        const { playerIds, ...teamData } = data;
        const team = await repositories_1.teamRepository.create({
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
    async addPlayersToTeam(teamId, tenantId, playerIds) {
        const team = await repositories_1.teamRepository.findById(teamId, tenantId);
        if (!team) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.TEAM_NOT_FOUND);
        }
        if (!Array.isArray(playerIds) || playerIds.length === 0) {
            throw apiError_1.ApiError.badRequest("Please select at least one player to add to the team.");
        }
        const targetPlayers = await prisma_1.prisma.player.findMany({
            where: {
                tenantId,
                id: { in: playerIds },
            },
        });
        await Promise.all(targetPlayers.map((p) => {
            const updatedTeamIds = Array.from(new Set([...(p.teamIds || []), teamId]));
            return prisma_1.prisma.player.update({
                where: { id: p.id },
                data: { teamIds: updatedTeamIds },
            });
        }));
        return {
            addedCount: targetPlayers.length,
            message: `${targetPlayers.length} player(s) added to ${team.name}.`,
        };
    }
    async removePlayerFromTeam(teamId, tenantId, playerId) {
        const team = await repositories_1.teamRepository.findById(teamId, tenantId);
        if (!team) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.TEAM_NOT_FOUND);
        }
        const player = await repositories_1.playerRepository.findById(playerId, tenantId);
        if (!player) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.PLAYER_NOT_FOUND);
        }
        await prisma_1.prisma.player.update({
            where: { id: player.id },
            data: {
                teamIds: (player.teamIds || []).filter((tid) => tid !== teamId),
            },
        });
        return {
            message: `${player.name} removed from ${team.name}.`,
        };
    }
    async updateTeam(id, tenantId, data) {
        const updated = await repositories_1.teamRepository.update(id, tenantId, data);
        if (!updated) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.TEAM_NOT_FOUND);
        }
        return {
            ...updated,
            _id: updated.id,
        };
    }
    async deleteTeam(id, tenantId) {
        const deleted = await repositories_1.teamRepository.delete(id, tenantId);
        if (!deleted) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.TEAM_NOT_FOUND);
        }
        // Cascade delete all records belonging to this team so no orphaned stats remain
        await Promise.all([
            prisma_1.prisma.matchPayment.deleteMany({ where: { tenantId, teamId: id } }),
            prisma_1.prisma.match.deleteMany({ where: { tenantId, teamId: id } }),
            prisma_1.prisma.tournament.deleteMany({ where: { tenantId, teamId: id } }),
            prisma_1.prisma.expense.deleteMany({ where: { tenantId, teamId: id } }),
            prisma_1.prisma.sponsor.deleteMany({ where: { tenantId, teamId: id } }),
            prisma_1.prisma.playerReturn.deleteMany({ where: { tenantId, teamId: id } }),
        ]);
        // Also pull this teamId from any players who had it in teamIds
        const enrolledPlayers = await prisma_1.prisma.player.findMany({
            where: { tenantId, teamIds: { has: id } },
        });
        if (enrolledPlayers.length > 0) {
            await Promise.all(enrolledPlayers.map((p) => prisma_1.prisma.player.update({
                where: { id: p.id },
                data: { teamIds: p.teamIds.filter((tid) => tid !== id) },
            })));
        }
        return {
            message: constants_1.MESSAGES.TEAM_DELETED,
        };
    }
}
exports.TeamService = TeamService;
exports.teamService = new TeamService();
