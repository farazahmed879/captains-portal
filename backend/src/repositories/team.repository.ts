import { prisma } from '../config/prisma';
import { Team } from '@prisma/client';

export class TeamRepository {
  async findById(id: string, tenantId?: string): Promise<Team | null> {
    return prisma.team.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Team[]> {
    return prisma.team.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCaptainOrEnrolled(
    tenantId: string,
    captainId: string,
    enrolledTeamIds: string[]
  ): Promise<Team[]> {
    return prisma.team.findMany({
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

  async create(data: {
    tenantId: string;
    captainId: string;
    name: string;
    shortName: string;
    city?: string;
    primaryColor?: string;
    description?: string;
    logo?: string;
  }): Promise<Team> {
    return prisma.team.create({
      data: {
        tenantId: data.tenantId,
        captainId: data.captainId,
        name: data.name,
        shortName: data.shortName.toUpperCase(),
        city: data.city || 'Karachi',
        primaryColor: data.primaryColor || '#0284c7',
        description: data.description,
        logo: data.logo,
      },
    });
  }

  async update(id: string, tenantId: string, data: Partial<Team>): Promise<Team | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.team.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Team | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.team.delete({
      where: { id },
    });
  }

  async count(tenantId: string, filter: any = {}): Promise<number> {
    return prisma.team.count({
      where: {
        tenantId,
        ...filter,
      },
    });
  }
}

export const teamRepository = new TeamRepository();
