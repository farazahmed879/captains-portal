"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teamRepository = exports.TeamRepository = void 0;
const prisma_1 = require("../config/prisma");
class TeamRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.team.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.team.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByCaptainOrEnrolled(tenantId, captainId, enrolledTeamIds) {
        return prisma_1.prisma.team.findMany({
            where: {
                tenantId,
                OR: [
                    { captainId },
                    ...(enrolledTeamIds.length > 0 ? [{ id: { in: enrolledTeamIds } }] : []),
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.team.create({
            data: {
                tenantId: data.tenantId,
                captainId: data.captainId,
                name: data.name,
                shortName: data.shortName.toUpperCase(),
                teamType: data.teamType || 'my_team',
                phone: data.phone || undefined,
                city: data.city || 'Karachi',
                primaryColor: data.primaryColor || '#0284c7',
                description: data.description,
                logo: data.logo,
            },
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.team.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.team.delete({
            where: { id },
        });
    }
    async count(tenantId, filter = {}) {
        return prisma_1.prisma.team.count({
            where: {
                tenantId,
                ...filter,
            },
        });
    }
}
exports.TeamRepository = TeamRepository;
exports.teamRepository = new TeamRepository();
