"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRepository = exports.PaymentRepository = void 0;
const prisma_1 = require("../config/prisma");
class PaymentRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.matchPayment.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.matchPayment.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findByMatch(tenantId, matchId) {
        return prisma_1.prisma.matchPayment.findMany({
            where: {
                tenantId,
                matchId,
            },
        });
    }
    async findByPlayer(tenantId, playerId) {
        return prisma_1.prisma.matchPayment.findMany({
            where: {
                tenantId,
                playerId,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async upsert(tenantId, matchId, playerId, data) {
        return prisma_1.prisma.matchPayment.upsert({
            where: {
                matchId_playerId: {
                    matchId,
                    playerId,
                },
            },
            create: {
                tenantId,
                teamId: data.teamId,
                matchId,
                playerId,
                feeAssigned: data.feeAssigned,
                feePaid: data.feePaid,
                paymentStatus: data.paymentStatus,
                paymentMethod: data.paymentMethod || 'cash',
                paymentDate: data.paymentDate,
                transactionRef: data.transactionRef,
                notes: data.notes,
            },
            update: {
                feePaid: data.feePaid,
                paymentStatus: data.paymentStatus,
                paymentMethod: data.paymentMethod || 'cash',
                paymentDate: data.paymentDate,
                transactionRef: data.transactionRef,
                notes: data.notes,
            },
        });
    }
}
exports.PaymentRepository = PaymentRepository;
exports.paymentRepository = new PaymentRepository();
