"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerReturnRepository = exports.PlayerReturnRepository = void 0;
const prisma_1 = require("../config/prisma");
class PlayerReturnRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.playerReturn.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.playerReturn.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { returnDate: 'desc' },
        });
    }
    async findByPlayer(tenantId, playerId) {
        return prisma_1.prisma.playerReturn.findMany({
            where: {
                tenantId,
                playerId,
            },
            orderBy: { returnDate: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.playerReturn.create({
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.playerReturn.delete({
            where: { id },
        });
    }
}
exports.PlayerReturnRepository = PlayerReturnRepository;
exports.playerReturnRepository = new PlayerReturnRepository();
