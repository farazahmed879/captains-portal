import { prisma } from '../config/prisma';
import { PlayerReturn } from '@prisma/client';

export class PlayerReturnRepository {
  async findById(id: string, tenantId?: string): Promise<PlayerReturn | null> {
    return prisma.playerReturn.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<PlayerReturn[]> {
    return prisma.playerReturn.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { returnDate: 'desc' },
    });
  }

  async findByPlayer(tenantId: string, playerId: string): Promise<PlayerReturn[]> {
    return prisma.playerReturn.findMany({
      where: {
        tenantId,
        playerId,
      },
      orderBy: { returnDate: 'desc' },
    });
  }

  async create(data: any): Promise<PlayerReturn> {
    return prisma.playerReturn.create({
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<PlayerReturn | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.playerReturn.delete({
      where: { id },
    });
  }
}

export const playerReturnRepository = new PlayerReturnRepository();
