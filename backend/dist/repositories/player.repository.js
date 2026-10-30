"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerRepository = exports.PlayerRepository = void 0;
const prisma_1 = require("../config/prisma");
class PlayerRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.player.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.player.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { name: 'asc' },
        });
    }
    async findByTeam(tenantId, teamId) {
        return prisma_1.prisma.player.findMany({
            where: {
                tenantId,
                teamIds: { has: teamId },
                isActive: true,
            },
            orderBy: { name: 'asc' },
        });
    }
    async findByMatchingCriteria(tenantId, criteria) {
        const orConditions = [];
        if (criteria.id) {
            orConditions.push({ id: criteria.id });
        }
        if (criteria.phone) {
            const cleanPhone = criteria.phone.replace(/[\s\-()+]/g, '');
            orConditions.push({ phone: { equals: criteria.phone, mode: 'insensitive' } });
            if (cleanPhone.length >= 7) {
                orConditions.push({ phone: { contains: cleanPhone } });
            }
        }
        if (criteria.email) {
            orConditions.push({ email: { equals: criteria.email.toLowerCase(), mode: 'insensitive' } });
        }
        if (criteria.name) {
            const firstName = criteria.name.trim().split(' ')[0];
            orConditions.push({ name: { equals: criteria.name.trim(), mode: 'insensitive' } });
            if (firstName.length >= 3) {
                orConditions.push({ name: { contains: firstName, mode: 'insensitive' } });
            }
        }
        if (orConditions.length === 0)
            return null;
        return prisma_1.prisma.player.findFirst({
            where: {
                tenantId,
                OR: orConditions,
            },
        });
    }
    async create(data) {
        return prisma_1.prisma.player.create({
            data: {
                tenantId: data.tenantId,
                name: data.name,
                teamIds: data.teamIds || [],
                phone: data.phone,
                email: data.email ? data.email.toLowerCase() : undefined,
                role: data.role || 'all_rounder',
                battingStyle: data.battingStyle || 'right_hand',
                bowlingStyle: data.bowlingStyle || 'right_arm_medium',
                jerseyNumber: data.jerseyNumber,
                profilePhoto: data.profilePhoto,
                isRegular: data.isRegular !== undefined ? data.isRegular : true,
                notes: data.notes,
                isActive: true,
            },
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.player.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.player.delete({
            where: { id },
        });
    }
    async count(tenantId, filter = {}) {
        return prisma_1.prisma.player.count({
            where: {
                tenantId,
                ...filter,
            },
        });
    }
}
exports.PlayerRepository = PlayerRepository;
exports.playerRepository = new PlayerRepository();
