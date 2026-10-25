import { prisma } from '../config/prisma';
import { MatchPayment } from '@prisma/client';

export class PaymentRepository {
  async findById(id: string, tenantId?: string): Promise<MatchPayment | null> {
    return prisma.matchPayment.findFirst({
      where: {
        id,
        ...(tenantId ? { tenantId } : {}),
      },
    });
  }

  async findMany(tenantId: string, filter: any = {}): Promise<MatchPayment[]> {
    return prisma.matchPayment.findMany({
      where: {
        tenantId,
        ...filter,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByMatch(tenantId: string, matchId: string): Promise<MatchPayment[]> {
    return prisma.matchPayment.findMany({
      where: {
        tenantId,
        matchId,
      },
    });
  }

  async findByPlayer(tenantId: string, playerId: string): Promise<MatchPayment[]> {
    return prisma.matchPayment.findMany({
      where: {
        tenantId,
        playerId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsert(
    tenantId: string,
    matchId: string,
    playerId: string,
    data: {
      teamId: string;
      feeAssigned: number;
      feePaid: number;
      paymentStatus: string;
      paymentMethod?: string;
      paymentDate?: Date;
      transactionRef?: string;
      notes?: string;
    }
  ): Promise<MatchPayment> {
    return prisma.matchPayment.upsert({
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

export const paymentRepository = new PaymentRepository();
