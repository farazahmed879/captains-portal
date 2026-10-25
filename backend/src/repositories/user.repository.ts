import { prisma } from '../config/prisma';
import { User } from '@prisma/client';
import { UserRole } from '../enums';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(tenantId: string, email: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        tenantId,
        email: { equals: email, mode: 'insensitive' },
      },
    });
  }

  async findByPhone(tenantId: string, phone: string): Promise<User | null> {
    const cleanDigits = phone.replace(/[\s\-()+]/g, '');
    return prisma.user.findFirst({
      where: {
        tenantId,
        OR: [
          { phone: { equals: phone, mode: 'insensitive' } },
          { phone: { contains: cleanDigits } },
        ],
      },
    });
  }

  async findByIdentifier(rawIdentifier: string): Promise<User | null> {
    const trimmed = rawIdentifier.trim();
    const cleanDigits = trimmed.replace(/[\s\-()+]/g, '');

    return prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: trimmed.toLowerCase(), mode: 'insensitive' } },
          { phone: { equals: trimmed, mode: 'insensitive' } },
          ...(cleanDigits.length >= 7 ? [{ phone: { contains: cleanDigits } }] : []),
        ],
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    tenantId: string;
    name: string;
    email: string;
    password: string;
    phone?: string;
    playerId?: string;
    role?: string;
    isActive?: boolean;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        email: data.email.toLowerCase(),
        password: data.password,
        phone: data.phone,
        playerId: data.playerId,
        role: data.role || UserRole.CAPTAIN,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateRole(id: string, role: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { role },
    });
  }

  async updateStatus(id: string, isActive: boolean): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  async updateDashboardSettings(id: string, settings: any): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        dashboardSettings: settings,
      },
    });
  }

  async countAdmins(tenantId: string): Promise<number> {
    return prisma.user.count({
      where: {
        tenantId,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
  }

  async delete(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
