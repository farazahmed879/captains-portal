"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sponsorRepository = exports.SponsorRepository = void 0;
const prisma_1 = require("../config/prisma");
class SponsorRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.sponsor.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.sponsor.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.sponsor.create({
            data: {
                ...data,
                transactions: data.transactions || [],
            },
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.sponsor.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.sponsor.delete({
            where: { id },
        });
    }
}
exports.SponsorRepository = SponsorRepository;
exports.sponsorRepository = new SponsorRepository();
