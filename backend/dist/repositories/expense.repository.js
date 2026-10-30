"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRepository = exports.ExpenseRepository = void 0;
const prisma_1 = require("../config/prisma");
class ExpenseRepository {
    async findById(id, tenantId) {
        return prisma_1.prisma.expense.findFirst({
            where: {
                id,
                ...(tenantId ? { tenantId } : {}),
            },
        });
    }
    async findMany(tenantId, filter = {}) {
        return prisma_1.prisma.expense.findMany({
            where: {
                tenantId,
                ...filter,
            },
            orderBy: { expenseDate: 'desc' },
        });
    }
    async create(data) {
        return prisma_1.prisma.expense.create({
            data,
        });
    }
    async update(id, tenantId, data) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.expense.update({
            where: { id },
            data,
        });
    }
    async delete(id, tenantId) {
        const existing = await this.findById(id, tenantId);
        if (!existing)
            return null;
        return prisma_1.prisma.expense.delete({
            where: { id },
        });
    }
    async aggregateTotal(tenantId, filter = {}) {
        const expenses = await this.findMany(tenantId, filter);
        return expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    }
}
exports.ExpenseRepository = ExpenseRepository;
exports.expenseRepository = new ExpenseRepository();
