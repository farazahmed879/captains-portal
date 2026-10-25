import { prisma } from '../config/prisma';
import { Player } from '@prisma/client';

export class PlayerRepository {
  async findById(id: string, tenantId?: string): Promise<Player | null> {
    return prisma.player.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<Player[]> {
    return prisma.player.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByTeam(tenantId: string, teamId: string): Promise<Player[]> {
    return prisma.player.findMany({
      where: {
        tenantId,
        teamIds: { has: teamId },
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findByMatchingCriteria(
    tenantId: string,
    criteria: { id?: string; phone?: string; email?: string; name?: string }
  ): Promise<Player | null> {
    const orConditions: any[] = [];

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

    if (orConditions.length === 0) return null;

    return prisma.player.findFirst({
      where: {
        tenantId,
        OR: orConditions,
      },
    });
  }

  async create(data: {
    tenantId: string;
    name: string;
    teamIds?: string[];
    phone?: string;
    email?: string;
    role?: string;
    battingStyle?: string;
    bowlingStyle?: string;
    jerseyNumber?: number;
    profilePhoto?: string;
    isRegular?: boolean;
    notes?: string;
  }): Promise<Player> {
    return prisma.player.create({
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

  async update(id: string, tenantId: string, data: Partial<Player>): Promise<Player | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.player.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, tenantId: string): Promise<Player | null> {
    const existing = await this.findById(id, tenantId);
    if (!existing) return null;

    return prisma.player.delete({
      where: { id },
    });
  }

  async count(tenantId: string, filter: any = {}): Promise<number> {
    return prisma.player.count({
      where: {
        tenantId,
        ...filter,
      },
    });
  }
}

export const playerRepository = new PlayerRepository();
