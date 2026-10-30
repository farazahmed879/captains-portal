"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRepository = exports.MatchRepository = void 0;
const prisma_1 = require("../config/prisma");
class MatchRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.match.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.match.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { matchDate: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.match.create({
            data,
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.match.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.match.delete({
            where: { id },
        });
    }
    async count(tenantId, filter = {}) {
        return prisma_1.prisma.match.count({
            where: {
                tenantId,
                ...filter,
            },
        });
    }
}
exports.MatchRepository = MatchRepository;
exports.matchRepository = new MatchRepository();
