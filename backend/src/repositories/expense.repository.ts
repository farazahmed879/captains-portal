import { prisma } from '../config/prisma';
import { Expense } from '@prisma/client';

export class ExpenseRepository {
  async findById(id: string, tenantId?: string): Promise<Expense | null> {
    return prisma.expense.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Expense[]> {
    return prisma.expense.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async create(data: any): Promise<Expense> {
    return prisma.expense.create({
      data,
    });
  }

  async update(id: string, tenantId: string, data: Partial<Expense>): Promise<Expense | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.expense.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Expense | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.expense.delete({
      where: { id },
    });
  }

  async aggregateTotal(tenantId: string, filter: any = {}): Promise<number> {
    const expenses = await this.findMany(tenantId, filter);
    return expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }
}

export const expenseRepository = new ExpenseRepository();
