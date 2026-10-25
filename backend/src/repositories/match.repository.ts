import { prisma } from '../config/prisma';
import { Match } from '@prisma/client';

export class MatchRepository {
  async findById(id: string, tenantId?: string): Promise<Match | null> {
    return prisma.match.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Match[]> {
    return prisma.match.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { matchDate: 'desc' },
    });
  }

  async create(data: any): Promise<Match> {
    return prisma.match.create({
      data,
    });
  }

  async update(id: string, tenantId: string, data: Partial<Match>): Promise<Match | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.match.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Match | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.match.delete({
      where: { id },
    });
  }

  async count(tenantId: string, filter: any = {}): Promise<number> {
    return prisma.match.count({
      where: {
        tenantId,
        ...filter,
      },
    });
  }
}

export const matchRepository = new MatchRepository();
