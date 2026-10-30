"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentRepository = exports.TournamentRepository = void 0;
const prisma_1 = require("../config/prisma");
class TournamentRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.tournament.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.tournament.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.tournament.create({
            data,
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.tournament.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.tournament.delete({
            where: { id },
        });
    }
    async count(tenantId, filter = {}) {
        return prisma_1.prisma.tournament.count({
            where: {
                tenantId,
                ...filter,
            },
        });
    }
}
exports.TournamentRepository = TournamentRepository;
exports.tournamentRepository = new TournamentRepository();
