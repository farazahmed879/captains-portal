import { prisma } from '../config/prisma';
import { Tournament } from '@prisma/client';

export class TournamentRepository {
  async findById(id: string, tenantId?: string): Promise<Tournament | null> {
    return prisma.tournament.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Tournament[]> {
    return prisma.tournament.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(data: any): Promise<Tournament> {
    return prisma.tournament.create({
      data,
    });
  }

  async update(id: string, tenantId: string, data: Partial<Tournament>): Promise<Tournament | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.tournament.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Tournament | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.tournament.delete({
      where: { id },
    });
  }

  async count(tenantId: string, filter: any = {}): Promise<number> {
    return prisma.tournament.count({
      where: {
        tenantId,
        ...filter,
      },
    });
  }
}

export const tournamentRepository = new TournamentRepository();
