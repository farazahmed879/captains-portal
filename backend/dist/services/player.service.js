"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerService = exports.PlayerService = void 0;
const repositories_1 = require("../repositories");
const prisma_1 = require("../config/prisma");
const apiError_1 = require("../utils/apiError");
const constants_1 = require("../constants");
class PlayerService {
    async getPlayers(tenantId, teamIdQuery) {
        let filter = {};
        if (teamIdQuery) {
            filter.teamIds = { has: teamIdQuery };
        }
        const rawPlayers = await repositories_1.playerRepository.findMany(tenantId, filter);
        const enriched = await Promise.all(rawPlayers.map(async (p) => {
            const payments = await repositories_1.paymentRepository.findByPlayer(tenantId, p.id);
            const returns = await repositories_1.playerReturnRepository.findByPlayer(tenantId, p.id);
            const totalFeeAssigned = payments.reduce((acc, pay) => acc + (pay.feeAssigned || 0), 0);
            const totalFeePaid = payments.reduce((acc, pay) => acc + (pay.feePaid || 0), 0);
            const totalReturned = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
            const pendingDue = Math.max(0, totalFeeAssigned - totalFeePaid);
            const advanceCredit = Math.max(0, totalFeePaid - totalFeeAssigned);
            const teams = await Promise.all(p.teamIds.map(async (tId) => {
                const team = await repositories_1.teamRepository.findById(tId, tenantId);
                return team
                    ? {
                        _id: team.id,
                        id: team.id,
                        name: team.name,
                        shortName: team.shortName,
                        primaryColor: team.primaryColor,
                    }
                    : null;
            }));
            const lastPayment = payments[0];
            const lastMatchDate = lastPayment
                ? lastPayment.paymentDate || lastPayment.createdAt || null
                : null;
            return {
                ...p,
                _id: p.id,
                teamIds: teams.filter(Boolean),
                matchesPlayed: payments.length,
                lastMatchDate,
                totalFeeAssigned,
                totalFeePaid,
                totalReturned,
                pendingDue,
                advanceCredit,
            };
        }));
        return enriched;
    }
    async getPlayerById(id, tenantId) {
        const player = await repositories_1.playerRepository.findById(id, tenantId);
        if (!player) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.PLAYER_NOT_FOUND);
        }
        const payments = await repositories_1.paymentRepository.findByPlayer(tenantId, id);
        const returns = await repositories_1.playerReturnRepository.findByPlayer(tenantId, id);
        const totalFeeAssigned = payments.reduce((acc, pay) => acc + (pay.feeAssigned || 0), 0);
        const totalFeePaid = payments.reduce((acc, pay) => acc + (pay.feePaid || 0), 0);
        const totalReturned = returns.reduce((acc, ret) => acc + (ret.amount || 0), 0);
        return {
            player: {
                ...player,
                _id: player.id,
            },
            payments: payments.map((p) => ({ ...p, _id: p.id })),
            returns: returns.map((r) => ({ ...r, _id: r.id })),
            stats: {
                totalFeeAssigned,
                totalFeePaid,
                totalReturned,
                pendingDue: Math.max(0, totalFeeAssigned - totalFeePaid),
                advanceCredit: Math.max(0, totalFeePaid - totalFeeAssigned),
            },
        };
    }
    async createPlayer(tenantId, data) {
        if (!data.name || !data.name.trim()) {
            throw apiError_1.ApiError.badRequest('Player name is required');
        }
        const player = await repositories_1.playerRepository.create({
            tenantId,
            ...data,
            name: data.name.trim(),
        });
        return {
            ...player,
            _id: player.id,
        };
    }
    async updatePlayer(id, tenantId, data) {
        const updated = await repositories_1.playerRepository.update(id, tenantId, data);
        if (!updated) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.PLAYER_NOT_FOUND);
        }
        return {
            ...updated,
            _id: updated.id,
        };
    }
    async deletePlayer(id, tenantId) {
        const deleted = await repositories_1.playerRepository.delete(id, tenantId);
        if (!deleted) {
            throw apiError_1.ApiError.notFound(constants_1.MESSAGES.PLAYER_NOT_FOUND);
        }
        // Cascade delete player's payment and return records so ledger stats stay clean
        await Promise.all([
            prisma_1.prisma.matchPayment.deleteMany({ where: { tenantId, playerId: id } }),
            prisma_1.prisma.playerReturn.deleteMany({ where: { tenantId, playerId: id } }),
        ]);
        return {
            message: constants_1.MESSAGES.PLAYER_DELETED,
        };
    }
}
exports.PlayerService = PlayerService;
exports.playerService = new PlayerService();
