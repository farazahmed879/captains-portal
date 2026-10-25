import { prisma } from '../config/prisma';
import { Sponsor } from '@prisma/client';

export class SponsorRepository {
  async findById(id: string, tenantId?: string): Promise<Sponsor | null> {
    return prisma.sponsor.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Sponsor[]> {
    return prisma.sponsor.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: any): Promise<Sponsor> {
    return prisma.sponsor.create({
      data: {
        ...data,
        transactions: data.transactions || [],
      },
    });
  }

  async update(id: string, tenantId: string, data: Partial<Sponsor>): Promise<Sponsor | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.sponsor.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Sponsor | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.sponsor.delete({
      where: { id },
    });
  }
}

export const sponsorRepository = new SponsorRepository();
