"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const prisma_1 = require("../config/prisma");
const enums_1 = require("../enums");
class UserRepository {
    async findById(id) {
        return prisma_1.prisma.user.findUnique({
            where: { id },
        });
    }
    async findByEmail(tenantId, email) {
        return prisma_1.prisma.user.findFirst({
            where: {
                tenantId,
                email: { equals: email, mode: 'insensitive' },
            },
        });
    }
    async findByPhone(tenantId, phone) {
        const cleanDigits = phone.replace(/[\s\-()+]/g, '');
        return prisma_1.prisma.user.findFirst({
            where: {
                tenantId,
                OR: [
                    { phone: { equals: phone, mode: 'insensitive' } },
                    { phone: { contains: cleanDigits } },
                ],
            },
        });
    }
    async findByIdentifier(rawIdentifier) {
        const trimmed = rawIdentifier.trim();
        const cleanDigits = trimmed.replace(/[\s\-()+]/g, '');
        return prisma_1.prisma.user.findFirst({
            where: {
                OR: [
                    { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } },
                    { phone: { equals: trimmed, mode: 'insensitive' } },
                    ...(cleanDigits.length >= 7 ? [{ phone: { contains: cleanDigits } }] : []),
                ],
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.user.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.user.create({
            data: {
                tenantId: data.tenantId,
                name: data.name,
                email: data.email.toLowerCase(),
                password: data.password,
                phone: data.phone,
                playerId: data.playerId,
                role: data.role || enums_1.UserRole.CAPTAIN,
                isActive: data.isActive !== undefined ? data.isActive : true,
            },
        });
    }
    async update(id, data) {
        return prisma_1.prisma.user.update({
            where: { id },
            data,
        });
    }
    async updateRole(id, role) {
        return prisma_1.prisma.user.update({
            where: { id },
            data: { role },
        });
    }
    async updateStatus(id, isActive) {
        return prisma_1.prisma.user.update({
            where: { id },
            data: { isActive },
        });
    }
    async updateDashboardSettings(id, settings) {
        return prisma_1.prisma.user.update({
            where: { id },
            data: {
                dashboardSettings: settings,
            },
        });
    }
    async countAdmins(tenantId) {
        return prisma_1.prisma.user.count({
            where: {
                tenantId,
                role: enums_1.UserRole.SUPER_ADMIN,
                isActive: true,
            },
        });
    }
    async delete(id) {
        return prisma_1.prisma.user.delete({
            where: { id },
        });
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
